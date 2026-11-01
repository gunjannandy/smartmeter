/* Pure simulation of one Box. No DOM, no three.js, so it can be tested in Node.
   Every number about vehicles is an ILLUSTRATIVE assumption until we measure real chargers. */

export const TYPES = {
  toto:    { label: 'E-rickshaw', cap: 6.0, maxW: 560,  pf: 0.68 },
  ebike:   { label: 'E-bike',     cap: 0.9, maxW: 210,  pf: 0.60 },
  scooter: { label: 'E-scooter',  cap: 1.8, maxW: 330,  pf: 0.70 },
  loader:  { label: 'E-loader',   cap: 9.0, maxW: 1250, pf: 0.78 },
};
export const MAX_PODS = 6;
export const POD_COSTS = [20, 50, 80, 110];
export const SUPPLY_CHOICES = [10, 16, 20, 25, 32];
const taper = (s) => (s < 0.85 ? 1 : Math.max(0.04, (1 - s) / 0.15));

export function createSim({ pods = 2 } = {}) {
  let uid = 0, lid = 0;
  const st = {
    t: 18 * 60, speed: 45, power: true, wifi: true, rate: 10, supplyA: 40, tripped: false, overT: 0,
    credits: 1000, earned: 0, wallet: 0, unitsSold: 0, autoStart: false, selected: 'toto',
    volts: 231, totalA: 0, totalW: 0, outageAt: null, lastSync: null, syncAcc: 0, histAcc: 0,
    sockets: [],
    ledger: [],
  };
  const makeSocket = (i) => ({ id: i, status: 'free', vehicle: null, vid: 0, watts: 0, amps: 0, pf: 1, units: 0, cost: 0, arrive: 0, doneT: 0, hist: [] });
  for (let i = 0; i < pods; i++) st.sockets.push(makeSocket(i));
  const L = {};
  const on = (e, f) => { (L[e] = L[e] || []).push(f); };
  const emit = (e, d) => (L[e] || []).forEach((f) => f(d));
  const log = (type, text) => {
    st.ledger.unshift({ id: ++lid, t: st.t, type, text, synced: false });
    if (st.ledger.length > 60) st.ledger.pop();
    emit('ledger');
  };
  const toast = (text, kind = 'info') => emit('toast', { text, kind });
  const locked = () => st.credits <= -50;

  function spawn(type, bay) {
    const i = bay == null ? st.sockets.findIndex((s) => s.status === 'free') : bay;
    if (i < 0 || st.sockets[i].status !== 'free') { toast('No free socket. Remove a vehicle first.', 'warn'); return -1; }
    const s = st.sockets[i], tp = TYPES[type];
    s.vehicle = { uid: ++uid, type, soc: 0.08 + Math.random() * 0.45 };
    s.vid = s.vehicle.uid; s.status = 'arriving'; s.arrive = 2.4; s.units = 0; s.cost = 0; s.watts = 0; s.amps = 0; s.hist = [];
    log('arrived', `${tp.label} arrived at Socket ${i + 1}`);
    emit('spawn', i);
    return i;
  }
  function start(i) {
    const s = st.sockets[i];
    if (!s.vehicle || (s.status !== 'parked')) return false;
    if (!st.power) { toast('The Box has no power.', 'warn'); return false; }
    if (st.tripped) { toast('Breaker tripped. Reset it first.', 'bad'); return false; }
    if (locked()) { toast('Box locked: the Host needs to buy units.', 'bad'); return false; }
    s.status = 'charging'; s.units = 0; s.cost = 0;
    log('session_start', `Socket ${i + 1}: ${TYPES[s.vehicle.type].label} started at ₹${st.rate}/unit`);
    emit('start', i); return true;
  }
  function finish(i, reason) {
    const s = st.sockets[i];
    s.status = 'done'; s.doneT = 0; s.watts = 0; s.amps = 0;
    log('session_end', `Socket ${i + 1}: ${s.units.toFixed(2)} units, ₹${s.cost.toFixed(0)}. ${reason}`);
    toast(`Socket ${i + 1} finished: ${s.units.toFixed(2)} units, ₹${s.cost.toFixed(0)}. ${reason}`, 'ok');
    emit('done', i);
  }
  const stop = (i) => { if (st.sockets[i].status === 'charging' || st.sockets[i].status === 'stopped') finish(i, 'Stopped by the Driver.'); };
  function leave(i) {
    const s = st.sockets[i]; if (!s.vehicle) return;
    log('left', `Socket ${i + 1} is free again`);
    s.vehicle = null; s.status = 'free'; s.watts = 0; s.amps = 0; s.units = 0; s.cost = 0;
    emit('leave', i);
  }
  function resume(i) {
    const s = st.sockets[i];
    if (s.status !== 'stopped') return false;
    if (!st.power || st.tripped) { toast(st.tripped ? 'Reset the breaker first.' : 'No power.', 'warn'); return false; }
    s.status = 'charging';
    log('session_resumed', `Socket ${i + 1}: Driver tapped Resume. Charging after this is billed.`);
    emit('resume', i);
    return true;
  }
  function setPower(on) {
    if (on === st.power) return;
    st.power = on;
    if (!on) {
      st.outageAt = st.t;
      st.sockets.forEach((s) => { if (s.status === 'charging') s.status = 'stopped'; s.watts = 0; s.amps = 0; });
      st.volts = 0; st.totalA = 0; st.totalW = 0;
      toast('Power cut. Sessions are paused.', 'bad');
    } else {
      const m = Math.round(st.t - st.outageAt);
      log('power_restored', `Power was out for ${Math.floor(m / 60)}h ${m % 60}m. Every Socket came back off.`);
      st.sockets.forEach((s) => { if (s.status === 'stopped') emit('needsTap', s.id); });
      toast('Power is back. Drivers must tap Resume.', 'ok');
    }
    emit('power', on);
  }
  const nextPodCost = () => (st.sockets.length < MAX_PODS ? POD_COSTS[st.sockets.length - 2] : null);
  function buyPod() {
    const c = nextPodCost();
    if (c == null) { toast('This Box has the most plug points it can take.', 'warn'); return -1; }
    if (st.wallet < c) { toast(`You need ₹${c} to add a plug point.`, 'warn'); return -1; }
    st.wallet -= c; st.sockets.push(makeSocket(st.sockets.length));
    log('pod_added', `Plug point ${st.sockets.length} added (₹${c})`);
    emit('pod', st.sockets.length - 1); return st.sockets.length - 1;
  }
  const setWifi = (on) => { st.wifi = on; emit('wifi', on); };
  const setRate = (r) => { const v = Math.max(1, Math.min(50, r)); if (v !== st.rate) { st.rate = v; log('rate_change', `Rate set to ₹${v} per unit`); } };
  const setSupply = (a) => { st.supplyA = a; st.overT = 0; };
  function trip() {
    st.tripped = true; st.overT = 0;
    st.sockets.forEach((s) => { if (s.status === 'charging') s.status = 'stopped'; s.watts = 0; s.amps = 0; });
    st.totalA = 0; st.totalW = 0;
    log('breaker_trip', `Breaker tripped: load was above ${st.supplyA} A`);
    toast(`Breaker tripped. Load went above ${st.supplyA} A.`, 'bad');
    emit('trip');
  }
  function resetBreaker() { if (!st.tripped) return; st.tripped = false; log('breaker_reset', 'Host reset the breaker'); toast('Breaker reset. Drivers must tap Resume.', 'ok'); }
  function syncViaPhone() { st.ledger.forEach((e) => (e.synced = true)); st.lastSync = 'Host phone'; emit('ledger'); toast('Ledger synced through the Host phone.', 'ok'); }

  function step(dtReal) {
    const dt = Math.min(dtReal, 0.1), dtMin = dt * st.speed, dtH = dtMin / 60;
    st.t += dtMin;
    st.sockets.forEach((s) => {
      if (s.status === 'arriving') { s.arrive -= dt; if (s.arrive <= 0) { s.status = 'parked'; if (st.autoStart) start(s.id); } }
      if (s.status === 'done') { s.doneT += dt; if (s.doneT > 5) leave(s.id); }
    });
    if (st.power && !st.tripped) {
      st.volts = 231 - 0.35 * st.totalA + 1.2 * Math.sin(st.t * 0.31);
      let sumA = 0, sumW = 0;
      st.sockets.forEach((s) => {
        if (s.status !== 'charging') { s.watts = 0; s.amps = 0; return; }
        const v = s.vehicle, tp = TYPES[v.type];
        s.watts = tp.maxW * taper(v.soc) * (0.97 + 0.03 * Math.sin(st.t * 0.7 + s.id * 2));
        s.pf = tp.pf * (0.9 + 0.1 * taper(v.soc));
        s.amps = s.watts / (st.volts * s.pf);
        sumA += s.amps; sumW += s.watts;
        const kwh = (s.watts * dtH) / 1000;
        v.soc = Math.min(1, v.soc + kwh / tp.cap);
        s.units += kwh; s.cost += kwh * st.rate; st.earned += kwh * st.rate; st.wallet += kwh * st.rate; st.unitsSold += kwh; st.credits -= kwh;
      });
      st.totalA = sumA; st.totalW = sumW;
      st.sockets.forEach((s) => { if (s.status === 'charging' && s.vehicle.soc >= 0.998) finish(s.id, 'Battery full, session ended automatically.'); });
      if (sumA > st.supplyA) { st.overT += dt; if (st.overT > 2.5) trip(); } else st.overT = Math.max(0, st.overT - dt * 2);
    }
    st.histAcc += dt;
    if (st.histAcc >= 0.5) { st.histAcc = 0; st.sockets.forEach((s) => { s.hist.push(s.watts); if (s.hist.length > 48) s.hist.shift(); }); }
    if (st.wifi && st.power) {
      st.syncAcc += dt;
      while (st.syncAcc >= 0.3) { st.syncAcc -= 0.3; const e = [...st.ledger].reverse().find((x) => !x.synced); if (!e) break; e.synced = true; st.lastSync = 'Wi-Fi'; }
    }
  }
  return { state: st, on, step, nextPodCost, buyPod, spawn, start, stop, leave, resume, setPower, setWifi, setRate, setSupply, resetBreaker, syncViaPhone, locked, TYPES };
}
