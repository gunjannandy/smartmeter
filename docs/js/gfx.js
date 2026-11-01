import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
export { THREE };

/* Small helpers shared by the model builders. Everything is in metres. */

const texCache = new Map();
export function tex(key, w, h, draw, repeat) {
  const k = key + (repeat ? repeat.join('x') : '');
  if (texCache.has(k)) return texCache.get(k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  texCache.set(k, t); return t;
}
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0.05 }, o));
export const emissive = (color, k = 1.6) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.4 });
export const glassMat = () => new THREE.MeshStandardMaterial({ color: 0xcfe6f2, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.3, envMapIntensity: 1.4 });

export function rb(w, h, d, r, m) {
  const rad = Math.max(0.0005, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, rad), m);
}
export const place = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
export const box = (p, w, h, d, r, m, x, y, z) => place(p, rb(w, h, d, r, m), x, y, z);
export const plain = (p, w, h, d, m, x, y, z) => place(p, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
export const cyl = (p, r, h, m, x, y, z, seg = 14, r2) => place(p, new THREE.Mesh(new THREE.CylinderGeometry(r2 == null ? r : r2, r, h, seg), m), x, y, z);
export const ball = (p, r, m, x, y, z, ws = 18, hs = 12) => place(p, new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m), x, y, z);
export const ring = (p, r, tube, m, x, y, z) => place(p, new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 24), m), x, y, z);

export const glowTex = () => tex('glow', 64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});
export function glow(parent, color, size, x, y, z, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op }));
  s.scale.set(size, size, 1); s.position.set(x, y, z); s.userData.noShadow = true; parent.add(s); return s;
}
export function shadowize(obj, cast = true, receive = false) {
  obj.traverse((o) => { if (o.isMesh && !o.userData.noShadow) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}
export function dispose(obj) { obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); if (obj.parent) obj.parent.remove(obj); }

/* ---------- procedural textures ---------- */
export const asphaltTex = (rep) => tex('asphalt', 256, 256, (g, w, h) => {
  g.fillStyle = '#2d3238'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 40 + Math.floor(rnd() * 46); g.fillStyle = `rgb(${v},${v + 2},${v + 5})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  g.strokeStyle = 'rgba(15,17,20,.55)'; g.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 40; y += (rnd() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
}, rep);
export const concreteTex = (rep) => tex('concrete', 256, 256, (g, w, h) => {
  g.fillStyle = '#9a968c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) { const v = 130 + Math.floor(rnd() * 40); g.fillStyle = `rgb(${v},${v - 3},${v - 10})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.strokeStyle = 'rgba(60,58,52,.7)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}, rep);
export const brickTex = (rep) => tex('brick', 256, 256, (g, w, h) => {
  g.fillStyle = '#cdb99c'; g.fillRect(0, 0, w, h);
  const bh = 20, bw = 52;
  for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < w; x += bw) {
    const r = 150 + Math.floor(rnd() * 40); g.fillStyle = `rgb(${r},${Math.floor(r * 0.52)},${Math.floor(r * 0.4)})`; g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
  }
}, rep);
export const tinTex = (rep) => tex('tin', 128, 128, (g, w, h) => {
  for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#8a8f93'); gr.addColorStop(0.5, '#c4c9cc'); gr.addColorStop(1, '#7d8286'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(120,70,40,.25)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 1 + rnd() * 10); }
}, rep);
export const shutterTex = () => tex('shutter', 128, 128, (g, w, h) => {
  g.fillStyle = '#3f6b86'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, y + 2, w, 1); }
});
export const windowsTex = () => tex('windows', 128, 256, (g, w, h) => {
  g.fillStyle = '#7d6a58'; g.fillRect(0, 0, w, h);
  for (let y = 12; y < h - 12; y += 40) for (let x = 12; x < w - 12; x += 36) { const lit = rnd() > 0.45; g.fillStyle = lit ? '#ffd68a' : '#2b2f38'; g.fillRect(x, y, 20, 26); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + 12, 20, 2); }
});
export function signTex(key, w, h, bg, lines) {
  return tex(key, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l) => { g.fillStyle = l.color || '#fff'; g.font = `${l.weight || 700} ${l.size}px ${l.font || "'Noto Sans Bengali','DM Sans',sans-serif"}`; g.fillText(l.text, w / 2, l.y); });
  });
}
export const plateTex = (text) => tex('plate' + text, 128, 48, (g, w, h) => {
  g.fillStyle = '#f2c61b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#111'; g.font = "700 22px 'DM Mono',monospace"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 1);
});
export const qrTex = () => tex('qr', 64, 64, (g) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#111';
  const n = 9, s = 64 / n; let sd = 7; const r = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (r() > 0.5) g.fillRect(x * s, y * s, s, s);
  [[0, 0], [6, 0], [0, 6]].forEach(([qx, qy]) => { g.fillStyle = '#111'; g.fillRect(qx * s, qy * s, 3 * s, 3 * s); g.fillStyle = '#fff'; g.fillRect((qx + 0.5) * s, (qy + 0.5) * s, 2 * s, 2 * s); g.fillStyle = '#111'; g.fillRect((qx + 1) * s, (qy + 1) * s, s, s); });
});
export const posterTex = (i) => tex('poster' + i, 64, 96, (g, w, h) => {
  const hues = [8, 48, 200, 140]; g.fillStyle = `hsl(${hues[i % 4]},70%,55%)`; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(6, 8, w - 12, 18); g.fillStyle = 'rgba(0,0,0,.45)'; for (let y = 36; y < h - 8; y += 10) g.fillRect(8, y, w - 16 - (y % 20), 4);
});
