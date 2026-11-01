import { createSim, TYPES } from './js/sim.js';
import { createGame } from './js/game.js';
import { createScene } from './js/scene.js';
import { sfx } from './js/audio.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const ICONS = {
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="m17 9.5 5 5m0-5-5 5"/></svg>',
};
const star = (on) => `<svg viewBox="0 0 24 24"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on ? '#ffb02e' : 'rgba(255,255,255,.16)'}"/></svg>`;

function fallback() {
  document.body.classList.add('nogl');
  $('fallback').hidden = false;
  ['scene', 'labels', 'vignette', 'top', 'intro', 'toasts'].forEach((id) => { const el = $(id); if (el) el.hidden = true; });
}
function pickQuality() {
  const p = params.get('q'); if (p === 'low' || p === 'high') return p;
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  return weak ? 'low' : 'high';
}

async function boot() {
  try { await Promise.race([document.fonts.load("700 54px 'Noto Sans Bengali'", 'টোটো স্ট্যান্ড চা'), new Promise((r) => setTimeout(r, 1800))]); } catch (e) { /* use the fallback font */ }
  const sim = createSim(), game = createGame(sim), S = sim.state, G = game.state;
  let scene = null;
  try { scene = createScene({ canvas: $('scene'), labelsEl: $('labels'), sim, game, onTap: handleTap, quality: pickQuality() }); } catch (err) { console.error(err); }
  if (!scene) return fallback();
  window.__toto = { sim, game, scene };

  /* ---------- small helpers ---------- */
  const fmtINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  function toast(text, kind = 'info') {
    const box = $('toasts'); const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = text; box.appendChild(el);
    while (box.children.length > 2) box.firstChild.remove(); setTimeout(() => el.remove(), 3600);
  }
  const insets = () => { const open = ['stats', 'hostCard', 'insideCard'].map($).find((c) => !c.hidden); scene.setInsets({ top: $('top').offsetHeight, bottom: open ? open.offsetHeight + 20 : 0 }); };
  let openCard = null, statsI = -1, insideKind = 'hub', insideI = 0;
  function showCard(id) {
    ['stats', 'hostCard', 'insideCard'].forEach((c) => { $(c).hidden = c !== id; }); openCard = id;
    $('back').hidden = !id && scene.getFocus().kind === 'main'; insets();
  }
  function closeAll() { ['stats', 'hostCard', 'insideCard'].forEach((c) => { $(c).hidden = true; }); openCard = null; statsI = -1; scene.focus('main'); $('back').hidden = true; insets(); }
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); closeAll(); }));
  $('back').addEventListener('click', () => { sfx.tap(); closeAll(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  addEventListener('resize', insets);

  /* ---------- taps in the world ---------- */
  function handleTap(p) {
    sfx.unlock(); if (G.phase !== 'tutorial' && G.phase !== 'play') return;
    if (p.type === 'pod') { openInside('pod', p.i); sfx.tap(); return; }
    const r = game.tap(p);
    if (r.action === 'park') sfx.tap();
    else if (r.action === 'start' || r.action === 'resume') sfx.start();
    else if (r.action === 'stats') { openStats(r.i); game.inspected(); sfx.tap(); }
    else if (r.action === 'box') { openInside('hub'); sfx.tap(); }
    else if (r.action === 'host') { scene.focus('main'); showCard('hostCard'); sfx.tap(); }
    else if (r.action === 'wifi') toast(S.wifi ? 'Wi-Fi is on. The Box syncs to the cloud.' : 'Wi-Fi is off. The Box keeps metering and stores everything. Tap the Host to sync through their phone.', S.wifi ? 'ok' : 'warn');
  }
  function openStats(i) { statsI = i; scene.focus('vehicle', i); showCard('stats'); }
  function openInside(kind, i = 0) {
    insideKind = kind; insideI = i; scene.focus(kind, i); showCard('insideCard');
    if (kind === 'hub') {
      $('inTitle').textContent = 'Inside the Box'; $('inSub').textContent = '40 × 30 × 15 cm · mounted on the wall';
      $('inParts').innerHTML = '<li><b>Controller</b><span>Bluetooth and Wi-Fi. The brain. About 5 × 3 cm.</span></li><li><b>Breaker and earth-leakage protector</b><span>Cuts the supply if something goes wrong.</span></li><li><b>5 V power module</b><span>Powers the controller.</span></li><li><b>Prototype parts</b><span>Roughly ₹3,000 (an estimate, not a quote).</span></li>';
    } else {
      $('inTitle').textContent = 'Plug-point unit ' + (i + 1); $('inSub').textContent = '14 × 20 × 8 cm · one per parking spot';
      $('inParts').innerHTML = '<li><b>Meter</b><span>Measures volts, amps and units for this plug point only.</span></li><li><b>Relay</b><span>Switches this plug point on and off.</span></li><li><b>Small chip</b><span>Talks to the Box over a data cable.</span></li><li><b>Prototype parts</b><span>Roughly ₹1,000 to ₹1,500 (an estimate, not a quote).</span></li>';
    }
  }
  $('addPod').addEventListener('click', () => { const i = sim.buyPod(); if (i >= 0) { sfx.start(); toast('New plug point added.', 'ok'); closeAll(); } else sfx.err(); });
  $('rateUp').addEventListener('click', () => { sim.setRate(S.rate + 1); sfx.tap(); });
  $('rateDown').addEventListener('click', () => { sim.setRate(S.rate - 1); sfx.tap(); });
  $('syncBtn').addEventListener('click', () => { sim.syncViaPhone(); scene.flashSync(); sfx.start(); });

  /* ---------- events ---------- */
  sim.on('toast', (t) => toast(t.text, t.kind)); game.on('toast', (t) => { toast(t.text, t.kind); sfx.err(); });
  sim.on('power', (on) => { document.body.classList.toggle('dark', !on); if (on) sfx.restore(); else sfx.cut(); });
  sim.on('spawn', () => sfx.pop());
  sim.on('done', (i) => {
    const s = S.sockets[i], pos = scene.screenOf(i);
    if (pos) { const el = document.createElement('div'); el.className = 'pop'; el.textContent = '+' + fmtINR(s.cost); el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1700); }
    sfx.coin(); const w = document.querySelector('.wallet'); w.classList.add('pulse'); setTimeout(() => w.classList.remove('pulse'), 350);
  });
  game.on('step', () => { setTimeout(() => { if (openCard === 'stats' && G.phase === 'tutorial') closeAll(); }, 2400); });
  game.on('upset', () => { toast('A driver got tired of waiting and left.', 'warn'); sfx.err(); });
  game.on('phase', (ph) => {
    if (ph === 'play') toast(`Rush hour! Serve ${G.goal} vehicles. Tap each one to park it.`, 'ok');
    if (ph === 'over') { closeAll(); showOver(); }
  });
  function showOver() {
    $('stars').innerHTML = [1, 2, 3].map((n) => star(n <= G.stars)).join('');
    $('overTitle').textContent = G.stars === 3 ? 'Perfect shift' : G.stars === 2 ? 'Good shift' : 'Shift complete';
    $('overEarn').textContent = fmtINR(S.earned - G.startEarned); $('overServed').textContent = G.served; $('overUpset').textContent = G.upset; $('overUnits').textContent = S.unitsSold.toFixed(1);
    $('over').hidden = false; sfx.win();
  }

  /* ---------- live HUD ---------- */
  let shown = 0;
  function tick() {
    shown += (S.wallet - shown) * 0.3; if (Math.abs(S.wallet - shown) < 0.5) shown = S.wallet; $('wallet').textContent = fmtINR(shown);
    const b = game.banner(); $('banner').hidden = !b;
    if (b) {
      if ($('bannerText').textContent !== b.text) $('bannerText').textContent = b.text;
      const dots = $('bannerDots'), n = Math.min(b.of, 12); if (dots.children.length !== n) dots.innerHTML = '<b></b>'.repeat(n);
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k < b.step));
    }
    if (openCard === 'stats' && statsI >= 0) {
      const s = S.sockets[statsI];
      if (!s || !s.vehicle) { closeAll(); } else {
        const tp = TYPES[s.vehicle.type];
        $('stTitle').textContent = tp.label; $('stSub').textContent = 'Plug point ' + (statsI + 1);
        $('stW').textContent = Math.round(s.watts); $('stBar').style.width = Math.round(s.vehicle.soc * 100) + '%';
        $('stV').textContent = S.power ? S.volts.toFixed(0) : '0'; $('stA').textContent = s.amps.toFixed(2); $('stPF').textContent = s.watts > 0 ? s.pf.toFixed(2) : '–';
        $('stU').textContent = s.units.toFixed(2); $('stR').textContent = fmtINR(s.cost); $('stP').textContent = Math.round(s.vehicle.soc * 100) + '%';
        $('stNote').textContent = s.status === 'charging' ? 'Cheap chargers draw more current than their watts suggest. That gap is the power factor.' : s.status === 'stopped' ? 'Paused. The driver has to tap to resume.' : s.status === 'done' ? 'Finished. Billed for exactly the units used.' : s.status === 'parked' ? 'Waiting for the driver to scan the QR.' : '';
      }
    }
    if (openCard === 'hostCard') {
      $('rateVal').textContent = fmtINR(S.rate); $('unitsLeft').textContent = Math.max(0, Math.round(S.credits));
      const syn = S.ledger.filter((e) => e.synced).length; $('ledgerCloud').textContent = `${syn} of ${S.ledger.length}`; $('syncBtn').hidden = S.wifi || syn === S.ledger.length;
    }
    if (openCard === 'insideCard') {
      const c = sim.nextPodCost(), btn = $('addPod');
      if (c == null) { btn.textContent = 'All 6 plug points are installed'; btn.disabled = true; }
      else { btn.disabled = S.wallet < c; btn.textContent = S.wallet < c ? `Add a plug point · ${fmtINR(c)} (need ${fmtINR(c - S.wallet)} more)` : `Add a plug point · ${fmtINR(c)}`; }
    }
    sfx.hum(S.sockets.filter((s) => s.status === 'charging').length);
  }
  setInterval(tick, 120);
  // the simulation advances with real time
  let last = performance.now();
  (function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; if (G.phase === 'tutorial' || G.phase === 'play') { sim.step(dt); game.update(dt); } })(last);

  /* ---------- sound, intro, restart ---------- */
  const mute = $('mute'); const paint = () => { mute.innerHTML = sfx.isMuted() ? ICONS.off : ICONS.on; mute.setAttribute('aria-pressed', String(sfx.isMuted())); }; paint();
  mute.addEventListener('click', () => { sfx.setMuted(!sfx.isMuted()); sfx.unlock(); paint(); });
  const start = $('start'); start.disabled = false; start.textContent = 'Start';
  start.addEventListener('click', () => { sfx.unlock(); sfx.pop(); $('intro').hidden = true; game.start(); insets(); });
  $('again').addEventListener('click', () => location.reload());
  insets();
}
boot().catch((err) => { console.error(err); fallback(); });
