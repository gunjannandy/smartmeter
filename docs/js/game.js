/* Game rules on top of the simulation: guided first run, a queue of waiting vehicles, patience, scoring.
   Pure logic (no DOM, no three.js) so it can be tested in Node. */

export const STEPS = [
  { key: 'park',   text: 'A Toto is waiting. Tap it to let it in.', icon: 'tap' },
  { key: 'scan',   text: 'The driver scans the QR. Tap the driver’s phone.', icon: 'phone' },
  { key: 'look',   text: 'Charging! Tap the Toto to see the live numbers.', icon: 'bolt' },
  { key: 'cut',    text: 'Tap the transformer to cut the power.', icon: 'power' },
  { key: 'back',   text: 'Tap the transformer again to bring power back.', icon: 'power' },
  { key: 'resume', text: 'Charging stopped. Tap the driver to resume.', icon: 'play' },
  { key: 'earn',   text: 'The Box stops by itself when the battery is full.', icon: 'check' },
  { key: 'pod',    text: 'You earned money. Tap the Box to add a plug point.', icon: 'plus' },
];

export function createGame(sim, { goal = 8, rng = Math.random } = {}) {
  const S = sim.state;
  const g = { phase: 'intro', step: 0, queue: [], nextId: 1, served: 0, upset: 0, goal, spawnT: 0, startEarned: 0, stars: 0, seen: false };
  const L = {};
  const on = (e, f) => { (L[e] = L[e] || []).push(f); };
  const emit = (e, d) => (L[e] || []).forEach((f) => f(d));
  const enqueue = (type, patience) => { const q = { id: g.nextId++, type, patience, max: patience }; g.queue.push(q); emit('queue', q); return q; };
  const nextStep = (key) => { if (g.phase === 'tutorial' && STEPS[g.step].key === key) { g.step++; emit('step', g.step); } };

  sim.on('spawn', () => nextStep('park'));
  sim.on('start', () => nextStep('scan'));
  sim.on('power', (on_) => { if (!on_) nextStep('cut'); else nextStep('back'); });
  sim.on('resume', () => nextStep('resume'));
  sim.on('done', () => {
    if (g.phase === 'tutorial') nextStep('earn');
    else if (g.phase === 'play') { g.served++; emit('served', g.served); checkEnd(); }
  });
  sim.on('pod', () => { if (g.phase === 'tutorial' && STEPS[g.step].key === 'pod') beginPlay(); });

  function start() {
    g.phase = 'tutorial'; g.step = 0; g.queue = []; g.served = 0; g.upset = 0; g.seen = false;
    enqueue('toto', Infinity); emit('phase', g.phase);
  }
  function beginPlay() {
    g.queue.forEach((q) => { if (!isFinite(q.patience)) { q.patience = 70; q.max = 70; } });
    g.phase = 'play'; g.spawnT = 6; g.startEarned = S.earned; g.served = 0; g.upset = 0; emit('phase', g.phase);
  }
  function checkEnd() {
    if (g.phase !== 'play' || g.served + g.upset < g.goal) return;
    g.phase = 'over';
    g.stars = g.upset === 0 ? 3 : g.upset <= 2 ? 2 : 1;
    emit('phase', g.phase);
  }
  function park(id) {
    const q = g.queue.find((x) => x.id === id); if (!q) return -1;
    const free = S.sockets.findIndex((s) => s.status === 'free');
    if (free < 0) { emit('toast', { text: 'No free plug point. Wait for one to finish.', kind: 'warn' }); return -1; }
    g.queue = g.queue.filter((x) => x !== q);
    const bay = sim.spawn(q.type, free); emit('parked', { id: q.id, bay, type: q.type }); return bay;
  }
  function inspected() { g.seen = true; nextStep('look'); }
  function update(dt) {
    if (g.phase !== 'play') return;
    g.queue.forEach((q) => { q.patience -= dt; });
    const gone = g.queue.filter((q) => q.patience <= 0);
    if (gone.length) { g.queue = g.queue.filter((q) => q.patience > 0); g.upset += gone.length; gone.forEach((q) => emit('upset', q)); checkEnd(); }
    const active = S.sockets.filter((s) => s.vehicle).length;
    const remaining = g.goal - g.served - g.upset - g.queue.length - active;
    g.spawnT -= dt;
    if (g.spawnT <= 0 && g.queue.length < 2 && active + g.queue.length < S.sockets.length + 1 && remaining > 0) { enqueue(rng() < 0.7 ? 'toto' : 'scooter', 70); g.spawnT = 10 + rng() * 5; }
  }
  /* What should a player tap now? Used for the bubbles above objects. */
  function bubbles() {
    const out = [];
    if (g.phase === 'tutorial') {
      const st = STEPS[g.step]; if (!st) return out;
      const mk = (o) => out.push(Object.assign({ text: st.text, icon: st.icon, tutorial: true }, o));
      if (st.key === 'park' && g.queue[0]) mk({ kind: 'queue', id: g.queue[0].id, text: 'Tap to park' });
      if (st.key === 'scan') { const i = S.sockets.findIndex((s) => s.status === 'parked'); if (i >= 0) mk({ kind: 'driver', i, text: 'Scan' }); }
      if (st.key === 'cut') mk({ kind: 'transformer', text: 'Cut power' });
      if (st.key === 'back') mk({ kind: 'transformer', text: 'Power back' });
      if (st.key === 'resume') { const i = S.sockets.findIndex((s) => s.status === 'stopped'); if (i >= 0 && S.power) mk({ kind: 'driver', i, text: 'Resume' }); }
      if (st.key === 'pod') mk({ kind: 'box', text: sim.nextPodCost() != null && S.wallet < sim.nextPodCost() ? `Need ₹${sim.nextPodCost()}` : 'Add plug point' });
    } else if (g.phase === 'play') {
      g.queue.forEach((q) => out.push({ kind: 'queue', id: q.id, text: 'Tap to park', icon: 'tap', progress: q.patience / q.max }));
      S.sockets.forEach((s, i) => {
        if (s.status === 'parked') out.push({ kind: 'driver', i, text: 'Scan', icon: 'phone' });
        if (s.status === 'stopped' && S.power) out.push({ kind: 'driver', i, text: 'Resume', icon: 'play' });
      });
      if (!S.power) out.push({ kind: 'transformer', text: 'Power is off. Tap to restore', icon: 'power' });
    }
    return out;
  }
  const banner = () => {
    if (g.phase === 'tutorial') return { text: STEPS[Math.min(g.step, STEPS.length - 1)].text, step: g.step, of: STEPS.length };
    if (g.phase === 'play') return { text: `Rush hour: ${g.served + g.upset} of ${g.goal} vehicles`, step: g.served + g.upset, of: g.goal };
    return null;
  };
  /* A tap on something in the world. Returns what the UI should do. */
  function tap(t) {
    if (g.phase !== 'tutorial' && g.phase !== 'play') return { action: 'none' };
    if (t.type === 'queue') { park(t.id); return { action: 'park' }; }
    if (t.type === 'driver' || t.type === 'vehicle') {
      const s = S.sockets[t.i]; if (!s) return { action: 'none' };
      if (t.type === 'driver' && s.status === 'parked') { sim.start(t.i); return { action: 'start', i: t.i }; }
      if (s.status === 'stopped') { sim.resume(t.i); return { action: 'resume', i: t.i }; }
      if (s.status === 'parked') { sim.start(t.i); return { action: 'start', i: t.i }; }
      if (s.vehicle) return { action: 'stats', i: t.i };
    }
    if (t.type === 'transformer') { sim.setPower(!S.power); return { action: 'power' }; }
    if (t.type === 'box') return { action: 'box' };
    if (t.type === 'pod') return { action: 'pod', i: t.i };
    if (t.type === 'host') return { action: 'host' };
    if (t.type === 'router') { sim.setWifi(!S.wifi); return { action: 'wifi' }; }
    return { action: 'none' };
  }
  return { state: g, on, start, park, update, bubbles, banner, tap, inspected, beginPlay, STEPS };
}
