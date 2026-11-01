/* Tiny synthesized sounds. Nothing is downloaded. The browser only allows audio after a first tap. */
let ctx = null, master = null, muted = false, hum = null;
try { muted = localStorage.getItem('toto-muted') === '1'; } catch (e) { /* storage may be blocked */ }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}
function tone(freq, dur, { type = 'sine', gain = 0.2, slide = 0, delay = 0 } = {}) {
  if (!ensure() || muted) return;
  const t0 = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
export const sfx = {
  unlock: ensure,
  tap() { tone(520, 0.08, { type: 'triangle', gain: 0.15 }); },
  start() { tone(380, 0.12, { type: 'triangle', gain: 0.16 }); tone(570, 0.16, { type: 'triangle', gain: 0.16, delay: 0.09 }); tone(760, 0.2, { type: 'triangle', gain: 0.14, delay: 0.18 }); },
  coin() { tone(988, 0.1, { type: 'square', gain: 0.07 }); tone(1480, 0.28, { type: 'square', gain: 0.07, delay: 0.09 }); },
  cut() { tone(220, 0.55, { type: 'sawtooth', gain: 0.12, slide: -170 }); },
  restore() { tone(160, 0.5, { type: 'sawtooth', gain: 0.09, slide: 260 }); tone(640, 0.15, { type: 'triangle', gain: 0.1, delay: 0.45 }); },
  pop() { tone(700, 0.07, { type: 'sine', gain: 0.12, slide: 300 }); },
  err() { tone(200, 0.18, { type: 'square', gain: 0.06 }); tone(150, 0.22, { type: 'square', gain: 0.06, delay: 0.14 }); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { type: 'triangle', gain: 0.14, delay: i * 0.12 })); },
  hum(level) {
    if (muted || !ensure()) { if (hum) hum.g.gain.value = 0; return; }
    if (!hum) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 100; g.gain.value = 0; o.connect(g); g.connect(master); o.start(); hum = { o, g }; }
    hum.g.gain.setTargetAtTime(Math.min(0.035, level * 0.012), ctx.currentTime, 0.2);
  },
  isMuted: () => muted,
  setMuted(m) { muted = m; try { localStorage.setItem('toto-muted', m ? '1' : '0'); } catch (e) { /* ignore */ } if (master) master.gain.value = m ? 0 : 0.5; if (m && hum) hum.g.gain.value = 0; },
};
