import { THREE, mat, emissive, glassMat, rb, box, plain, cyl, ball, ring, place, glow, shadowize, tex,
  asphaltTex, concreteTex, brickTex, tinTex, shutterTex, windowsTex, signTex, plateTex, qrTex, posterTex } from './gfx.js';

/* Every model faces -z (its front). All sizes are in metres and meant to look like a Kolkata street. */

const SKIN = [0xc68c60, 0xa86f46, 0xd2a077, 0x8d5a3b];
const TOTO_PAINT = [
  { body: 0xf3c317, roof: 0x1f8a4c, seat: 0x7a1f1f, stripe: 0x1f8a4c },
  { body: 0x2f63c9, roof: 0xefece2, seat: 0x1b1b1b, stripe: 0xefece2 },
  { body: 0xd8403a, roof: 0xf3c317, seat: 0x2b2b2b, stripe: 0xf3c317 },
];
const SCOOTER_PAINT = [0xefefe9, 0x1fa39a, 0x232629];

/* ---------- people ---------- */
export function makePerson({ shirt = 0x2f9e8f, pants = 0x2b3440, skin = 0, cap = null, gamchha = false, phone = true } = {}) {
  const g = new THREE.Group(), sk = mat(SKIN[skin % SKIN.length], { roughness: 0.8 });
  const legM = mat(pants, { roughness: 0.9 });
  [-0.075, 0.075].forEach((x) => { cyl(g, 0.065, 0.82, legM, x, 0.45, 0, 10, 0.055); box(g, 0.1, 0.06, 0.2, 0.025, mat(0x1a1a1a), x, 0.03, -0.03); });
  box(g, 0.34, 0.52, 0.2, 0.1, mat(shirt, { roughness: 0.85 }), 0, 1.1, 0);
  [-1, 1].forEach((s) => { const a = cyl(g, 0.045, 0.5, mat(shirt, { roughness: 0.85 }), s * 0.21, 1.05, -0.02, 8, 0.04); a.rotation.z = s * 0.12; ball(g, 0.04, sk, s * 0.235, 0.78, -0.02, 8, 6); });
  cyl(g, 0.05, 0.1, sk, 0, 1.4, 0, 8); ball(g, 0.12, sk, 0, 1.54, 0);
  const hair = ball(g, 0.125, mat(0x15110e), 0, 1.575, 0.015); hair.scale.set(1, 0.7, 1);
  if (cap) { const c = ball(g, 0.13, mat(cap), 0, 1.6, 0); c.scale.set(1, 0.55, 1); }
  if (gamchha) { const r = ring(g, 0.13, 0.03, mat(0xc9372c), 0, 1.38, 0); r.rotation.x = Math.PI / 2; }
  g.userData.phone = null; g.userData.phoneGlow = null;
  if (phone) {
    const ph = box(g, 0.075, 0.15, 0.012, 0.01, new THREE.MeshStandardMaterial({ color: 0x0c1015, emissive: 0x3d8bff, emissiveIntensity: 0.9 }), 0.17, 1.08, -0.2); ph.rotation.x = -0.45;
    g.userData.phone = ph; g.userData.phoneGlow = glow(g, 0x6aa8ff, 0.5, 0.17, 1.1, -0.22, 0.6);
  }
  return shadowize(g);
}

/* ---------- wheels ---------- */
function wheel(p, r, w, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  const t = cyl(g, r, w, mat(0x141618, { roughness: 0.95 }), 0, 0, 0, 22); t.rotation.z = Math.PI / 2;
  const rim = cyl(g, r * 0.62, w * 1.04, mat(0xcfd6dc, { roughness: 0.25, metalness: 0.85 }), 0, 0, 0, 18); rim.rotation.z = Math.PI / 2;
  const hub = cyl(g, r * 0.2, w * 1.1, mat(0x3a3f45, { metalness: 0.6 }), 0, 0, 0, 10); hub.rotation.z = Math.PI / 2;
  return g;
}
function fender(p, r, w, x, y, z, m) {
  const f = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 20, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: m.color, roughness: m.roughness, metalness: m.metalness, side: THREE.DoubleSide }));
  f.rotation.z = Math.PI / 2; f.position.set(x, y, z); p.add(f); return f;
}
function gauge(p, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  box(g, 0.4, 0.075, 0.02, 0.012, mat(0x101316), 0, 0, 0);
  const segs = [0, 1, 2, 3, 4].map((k) => { const m = new THREE.MeshStandardMaterial({ color: 0x23302a, emissive: 0x000000, emissiveIntensity: 1 }); box(g, 0.058, 0.04, 0.012, 0.006, m, (k - 2) * 0.072, 0, 0.012); return m; });
  return (soc, on) => segs.forEach((m, k) => { const lit = on && soc >= (k + 0.35) / 5; m.emissive.set(lit ? (soc > 0.98 ? 0x32e07a : 0x3d8bff) : 0x000000); m.color.set(lit ? 0x203040 : 0x23302a); m.emissiveIntensity = lit ? 1.6 : 0; });
}

/* ---------- Toto (battery e-rickshaw) ---------- */
export function makeToto(variant = 0) {
  const V = TOTO_PAINT[variant % TOTO_PAINT.length], g = new THREE.Group();
  const paint = mat(V.body, { roughness: 0.32, metalness: 0.3 }), roofM = mat(V.roof, { roughness: 0.55 }), seatM = mat(V.seat, { roughness: 0.9 });
  const dark = mat(0x1a1d21, { roughness: 0.6 }), chrome = mat(0xcfd6dc, { roughness: 0.2, metalness: 0.9 }), stripe = mat(V.stripe, { roughness: 0.5 });
  box(g, 0.96, 0.1, 2.3, 0.04, dark, 0, 0.36, 0.1); box(g, 0.62, 0.2, 0.9, 0.04, mat(0x23282e), 0, 0.28, 0.4);                         // chassis + battery pack
  box(g, 1.1, 0.56, 0.82, 0.14, paint, 0, 0.74, -0.85); box(g, 0.9, 0.2, 0.55, 0.1, paint, 0, 1.04, -0.96).rotation.x = 0.25;           // cowl + bonnet
  box(g, 1.12, 0.05, 0.84, 0.02, stripe, 0, 0.9, -0.85);
  [-1, 1].forEach((s) => {                                                                                                               // headlamps
    const h = ball(g, 0.075, emissive(0xfff1c8, 1.1), s * 0.31, 0.8, -1.25, 14, 10); h.scale.z = 0.6;
    glow(g, 0xffe9b0, 0.55, s * 0.31, 0.8, -1.3, 0.22); box(g, 0.05, 0.04, 0.03, 0.01, emissive(0xff9a2e, 0.8), s * 0.46, 0.7, -1.24);
  });
  box(g, 1.02, 0.5, 0.03, 0.012, glassMat(), 0, 1.45, -0.98).rotation.x = -0.18;                                                         // windshield
  box(g, 1.06, 0.035, 0.045, 0.015, chrome, 0, 1.7, -0.93); [-0.52, 0.52].forEach((x) => cyl(g, 0.016, 1.0, chrome, x, 1.2, -0.97, 8));
  cyl(g, 0.012, 0.62, chrome, 0, 1.06, -0.62, 8).rotation.z = Math.PI / 2; [-0.3, 0.3].forEach((x) => cyl(g, 0.02, 0.1, dark, x, 1.06, -0.62, 8).rotation.z = Math.PI / 2); // handlebar
  [-0.46, 0.46].forEach((x) => { cyl(g, 0.01, 0.2, chrome, x, 1.25, -0.88, 6); box(g, 0.1, 0.07, 0.015, 0.01, mat(0x20252a), x * 1.1, 1.36, -0.88); });   // mirrors
  box(g, 0.5, 0.1, 0.4, 0.05, seatM, 0, 0.88, -0.3); box(g, 0.5, 0.36, 0.08, 0.04, seatM, 0, 1.1, -0.08).rotation.x = -0.1;               // driver seat
  box(g, 1.14, 0.26, 1.25, 0.06, paint, 0, 0.56, 0.68);                                                                                   // rear body
  [-1, 1].forEach((s) => box(g, 0.05, 0.36, 1.05, 0.03, paint, s * 0.57, 0.86, 0.7));                                                     // half doors
  box(g, 1.0, 0.1, 0.52, 0.05, seatM, 0, 0.8, 0.7); box(g, 1.0, 0.42, 0.08, 0.05, seatM, 0, 1.03, 1.05);                                   // passenger bench
  box(g, 1.12, 0.52, 0.06, 0.03, paint, 0, 0.7, 1.29);                                                                                    // rear panel
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.125), new THREE.MeshStandardMaterial({ map: plateTex('WB 76 TT 4821'), roughness: 0.6 })); plate.position.set(0, 0.55, 1.325); g.add(plate);
  const setGauge = gauge(g, 0, 0.84, 1.325);
  [-1, 1].forEach((s) => { box(g, 0.07, 0.05, 0.02, 0.01, emissive(0xd62323, 0.9), s * 0.46, 0.66, 1.325); });
  box(g, 1.34, 0.07, 2.15, 0.07, roofM, 0, 1.92, 0.12); box(g, 1.3, 0.06, 0.4, 0.05, roofM, 0, 1.88, -1.0).rotation.x = 0.18;           // canopy + visor
  [-1, 1].forEach((s) => { cyl(g, 0.04, 1.5, mat(V.roof, { roughness: 0.8 }), s * 0.67, 1.8, 0.12, 10).rotation.x = Math.PI / 2; });          // rolled curtains
  [[-0.58, 1.12], [0.58, 1.12], [-0.52, -0.95], [0.52, -0.95]].forEach(([x, z]) => cyl(g, 0.017, 1.0, chrome, x, 1.4, z, 8));
  cyl(g, 0.012, 1.1, chrome, 0, 1.12, 1.22, 8).rotation.z = Math.PI / 2; box(g, 1.1, 0.07, 0.16, 0.03, chrome, 0, 0.4, 1.4);                 // grab rail + bumper
  const fw = wheel(g, 0.26, 0.1, 0, 0.26, -1.02), rl = wheel(g, 0.26, 0.12, -0.56, 0.26, 0.92), rr = wheel(g, 0.26, 0.12, 0.56, 0.26, 0.92);
  fender(g, 0.3, 0.14, 0, 0.26, -1.02, paint); [-0.56, 0.56].forEach((x) => fender(g, 0.3, 0.16, x, 0.26, 0.92, paint));
  const seated = new THREE.Group(); g.add(seated);                                                                                         // driver while driving
  const shirtM = mat(0xd9d4c4, { roughness: 0.9 });
  box(seated, 0.32, 0.46, 0.2, 0.1, shirtM, 0, 1.2, -0.27); ball(seated, 0.115, mat(SKIN[1]), 0, 1.57, -0.27); ball(seated, 0.12, mat(0x15110e), 0, 1.6, -0.25).scale.set(1, 0.65, 1);
  [-1, 1].forEach((s) => { const a = cyl(seated, 0.04, 0.5, shirtM, s * 0.2, 1.2, -0.45, 8); a.rotation.x = -1.1; });
  g.userData = { port: new THREE.Vector3(0, 0.52, -1.3), setGauge, seated, wheels: [fw, rl, rr], kind: 'toto' };
  return shadowize(g);
}

/* ---------- e-scooter ---------- */
export function makeScooter(variant = 0) {
  const col = SCOOTER_PAINT[variant % SCOOTER_PAINT.length], g = new THREE.Group();
  const paint = mat(col, { roughness: 0.3, metalness: 0.25 }), dark = mat(0x1c1f23, { roughness: 0.7 }), seatM = mat(0x16181b, { roughness: 0.9 }), chrome = mat(0xcfd6dc, { roughness: 0.2, metalness: 0.9 });
  const fw = wheel(g, 0.21, 0.09, 0, 0.21, -0.62), rw = wheel(g, 0.21, 0.1, 0, 0.21, 0.64);
  fender(g, 0.245, 0.12, 0, 0.21, -0.62, paint); fender(g, 0.245, 0.13, 0, 0.21, 0.64, paint);
  cyl(g, 0.016, 0.8, chrome, 0, 0.58, -0.56, 8).rotation.x = 0.2;
  box(g, 0.34, 0.62, 0.1, 0.08, paint, 0, 0.62, -0.5).rotation.x = 0.12;                                                                  // leg shield
  box(g, 0.2, 0.12, 0.09, 0.04, emissive(0xfff1c8, 0.9), 0, 0.98, -0.6); glow(g, 0xffe9b0, 0.4, 0, 0.98, -0.66, 0.2);                     // headlight
  cyl(g, 0.013, 0.64, chrome, 0, 1.03, -0.48, 8).rotation.z = Math.PI / 2; [-0.3, 0.3].forEach((x) => cyl(g, 0.02, 0.1, dark, x, 1.03, -0.48, 8).rotation.z = Math.PI / 2);
  [-0.22, 0.22].forEach((x) => { cyl(g, 0.008, 0.18, chrome, x, 1.14, -0.5, 6); box(g, 0.08, 0.05, 0.012, 0.008, dark, x * 1.1, 1.24, -0.5); });
  box(g, 0.34, 0.05, 0.6, 0.025, dark, 0, 0.3, -0.04);                                                                                    // floorboard
  box(g, 0.3, 0.4, 0.66, 0.12, paint, 0, 0.55, 0.4); box(g, 0.26, 0.2, 0.3, 0.08, paint, 0, 0.72, 0.74).rotation.x = -0.2;               // body + tail
  box(g, 0.28, 0.07, 0.56, 0.04, seatM, 0, 0.8, 0.28);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.1), new THREE.MeshStandardMaterial({ map: plateTex('WB 74 AK 1209'), roughness: 0.6 })); plate.position.set(0, 0.42, 0.9); plate.rotation.x = -0.1; g.add(plate);
  const setGauge = gauge(g, 0, 0.62, 0.9);
  box(g, 0.14, 0.04, 0.02, 0.01, emissive(0xd62323, 0.9), 0, 0.77, 0.9);
  const seated = new THREE.Group(); g.add(seated); const shirtM = mat(0x3a6ea5, { roughness: 0.9 });
  box(seated, 0.3, 0.46, 0.18, 0.1, shirtM, 0, 1.14, 0.18); ball(seated, 0.11, mat(SKIN[2]), 0, 1.5, 0.16); ball(seated, 0.115, mat(0x15110e), 0, 1.53, 0.18).scale.set(1, 0.65, 1);
  [-1, 1].forEach((s) => { const a = cyl(seated, 0.04, 0.55, shirtM, s * 0.19, 1.1, -0.14, 8); a.rotation.x = -1.15; });
  g.userData = { port: new THREE.Vector3(0, 0.42, -0.72), setGauge, seated, wheels: [fw, rw], kind: 'scooter' };
  return shadowize(g);
}

/* ---------- Box, plug-point units, trunk ---------- */
export const HUB_Y = 1.6, POD_Y = 0.98;
/* ---------- accurate internals (real part sizes, metres) ---------- */
const METAL = () => mat(0xb9c0c7, { metalness: 0.85, roughness: 0.3 });
const lbl = (key, w, h, text, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTex(key, o.pw || 128, o.ph || 48, o.bg || '#eef1f4', [{ text, size: o.size || 20, y: (o.ph || 48) / 2, font: "'DM Mono',monospace", color: o.color || '#222', weight: 500 }]) }));
function screwHead(p, x, y, z, r = 0.0026, axis = 'z') { const s = cyl(p, r, 0.0015, METAL(), x, y, z, 8); if (axis === 'z') s.rotation.x = Math.PI / 2; return s; }
function tube(p, pts, color, r = 0.0022) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 18, r, 6, false), mat(color, { roughness: 0.55 })); p.add(m); return m;
}
const LIVE = 0xd33a3a, NEUT = 0x2f6fd0, EARTH = 0x9ab32f;
function breaker(p, x, y, kind) {
  const g = new THREE.Group(); g.position.set(x, y, 0.04); p.add(g);
  box(g, 0.036, 0.085, 0.062, 0.004, mat(kind === 'spd' ? 0xdfe3e7 : 0xe6e8eb, { roughness: 0.5 }), 0, 0, 0);
  box(g, 0.03, 0.03, 0.004, 0.002, mat(0x2b2f35), 0, -0.012, 0.032);
  const tag = (key, text, y2) => { const m = lbl(key, 0.03, 0.013, text); m.position.set(0, y2, 0.0325); g.add(m); };
  if (kind === 'mcb') { box(g, 0.012, 0.02, 0.011, 0.003, mat(0xff8a1f), 0, -0.006, 0.037); tag('mcb', 'C32 · 32A', 0.026); }
  if (kind === 'rccb') { box(g, 0.012, 0.02, 0.011, 0.003, mat(0x14181d), 0, -0.006, 0.037); box(g, 0.009, 0.008, 0.006, 0.002, mat(0x3a7bd3), 0, 0.012, 0.035); tag('rccb', '30 mA · 40A', 0.03); }
  if (kind === 'spd') { box(g, 0.014, 0.012, 0.004, 0.002, mat(0x2fd37a, { emissive: 0x2fd37a, emissiveIntensity: 1.3 }), 0, 0.016, 0.034); tag('spd', 'SPD · 40kA', 0.032); }
  [0.0435, -0.0435].forEach((yy) => { box(g, 0.028, 0.0065, 0.012, 0.002, METAL(), 0, yy, 0.014); [-0.008, 0.008].forEach((xx) => screwHead(g, xx, yy + (yy > 0 ? 0.0035 : -0.0035), 0.014, 0.0032, 'y')); });
  return g;
}
function powerModule(p, x, y) {
  const g = new THREE.Group(); g.position.set(x, y, 0.016); p.add(g);
  box(g, 0.034, 0.02, 0.015, 0.002, mat(0x1d2430, { roughness: 0.6 }), 0, 0, 0);
  const l = lbl('psu', 0.03, 0.012, 'AC-DC 5V', { bg: '#cfd6dc' }); l.position.set(0, 0, 0.0078); g.add(l);
  [-0.012, -0.004, 0.004, 0.012].forEach((xx) => cyl(g, 0.0008, 0.006, METAL(), xx, -0.012, -0.002, 5));
  return g;
}
function esp32(p, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  box(g, 0.051, 0.028, 0.0016, 0.0003, mat(0x1a6e48, { roughness: 0.5 }), 0, 0, 0);
  box(g, 0.0255, 0.018, 0.0031, 0.0005, METAL(), -0.007, 0, 0.0023);
  const l = lbl('esp', 0.022, 0.007, 'ESP32', { bg: '#d6dbe0', size: 22 }); l.position.set(-0.007, 0, 0.004); g.add(l);
  box(g, 0.0115, 0.018, 0.0008, 0.0002, mat(0x0d1013), 0.0115, 0, 0.0012);
  [-0.006, -0.002, 0.002, 0.006].forEach((yy) => box(g, 0.009, 0.0007, 0.0006, 0.0001, mat(0xd8b64a, { metalness: 0.7 }), 0.0115, yy, 0.0018));
  [0.0128, -0.0128].forEach((yy) => { box(g, 0.047, 0.0025, 0.0085, 0.0003, mat(0x15181c), 0, yy, -0.0035); for (let k = -9; k <= 9; k++) cyl(g, 0.00035, 0.007, METAL(), k * 0.0025, yy, -0.0095, 4); });
  box(g, 0.0075, 0.0055, 0.0026, 0.0006, METAL(), -0.0262, 0, 0.0021);
  const led = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 1.4 }); box(g, 0.0014, 0.0008, 0.0006, 0.0002, led, 0.0135, 0.0105, 0.0011);
  return g;
}
function terminal(p, x, y, col) {
  box(p, 0.0098, 0.034, 0.026, 0.0015, mat(col, { roughness: 0.5 }), x, y, 0.016); box(p, 0.0075, 0.005, 0.002, 0.0006, mat(0x15191e), x, y - 0.008, 0.0295);
  screwHead(p, x, y + 0.009, 0.0295, 0.0028);
}
function din(p, y) { box(p, 0.34, 0.035, 0.008, 0.001, mat(0x9aa7b3, { metalness: 0.6, roughness: 0.4 }), 0, y, 0.004); [-0.15, 0.15].forEach((x) => screwHead(p, x, y, 0.0085, 0.003)); }
function buildHubInner(inner) {
  din(inner, 0.085); din(inner, -0.04);
  breaker(inner, -0.145, 0.085, 'mcb'); breaker(inner, -0.109, 0.085, 'rccb'); breaker(inner, -0.073, 0.085, 'spd');
  powerModule(inner, -0.018, 0.1);
  esp32(inner, 0.095, 0.09, 0.026);
  [[-0.021, 0.008], [0.021, 0.008], [-0.021, 0.172], [0.021, 0.172]].forEach(([dx]) => cyl(inner, 0.0022, 0.012, METAL(), 0.095 + dx, 0.09 + (dx < 0 ? -0.011 : 0.011), 0.011, 6).rotation.x = Math.PI / 2);
  [LIVE, LIVE, LIVE, NEUT, NEUT, NEUT, 0x6aa843, 0x6aa843, 0x777d84, 0x777d84].forEach((c, i) => terminal(inner, -0.0585 + i * 0.0125, -0.04, c));
  box(inner, 0.13, 0.004, 0.004, 0.001, mat(0xc98a3a, { metalness: 0.8, roughness: 0.4 }), -0.0225, -0.0185, 0.034);
  tube(inner, [[-0.123, -0.155, 0.05], [-0.123, -0.1, 0.05], [-0.0585, -0.085, 0.04], [-0.0585, -0.06, 0.032]], LIVE, 0.0028);
  tube(inner, [[-0.119, -0.155, 0.045], [-0.119, -0.105, 0.045], [-0.021, -0.088, 0.04], [-0.021, -0.06, 0.032]], NEUT, 0.0028);
  tube(inner, [[-0.127, -0.155, 0.04], [-0.127, -0.108, 0.04], [0.0165, -0.09, 0.04], [0.0165, -0.06, 0.032]], EARTH, 0.0028);
  tube(inner, [[0.0, -0.155, 0.05], [0.0, -0.1, 0.05], [0.0415, -0.088, 0.04], [0.0415, -0.06, 0.032]], LIVE, 0.0028);
  tube(inner, [[0.004, -0.155, 0.046], [0.004, -0.106, 0.046], [0.0665, -0.088, 0.04], [0.0665, -0.06, 0.032]], NEUT, 0.0028);
  tube(inner, [[0.008, -0.155, 0.04], [0.008, -0.108, 0.04], [0.0915, -0.09, 0.04], [0.0915, -0.06, 0.032]], 0x777d84, 0.0018);
  tube(inner, [[-0.0585, -0.022, 0.034], [-0.0585, 0.0, 0.07], [-0.151, 0.02, 0.07], [-0.151, 0.04, 0.054]], LIVE, 0.0028);
  tube(inner, [[-0.139, 0.131, 0.058], [-0.139, 0.142, 0.075], [-0.115, 0.142, 0.075], [-0.115, 0.131, 0.058]], LIVE, 0.0026);
  tube(inner, [[-0.103, 0.131, 0.058], [-0.103, 0.142, 0.075], [-0.079, 0.142, 0.075], [-0.079, 0.131, 0.058]], LIVE, 0.0026);
  tube(inner, [[-0.067, 0.04, 0.054], [-0.067, 0.02, 0.07], [-0.0225, 0.0, 0.07], [0.0415, -0.022, 0.034]], NEUT, 0.0026);
  tube(inner, [[-0.018, 0.108, 0.02], [0.02, 0.118, 0.045], [0.066, 0.108, 0.034], [0.07, 0.1, 0.03]], LIVE, 0.0011);
  tube(inner, [[-0.014, 0.108, 0.02], [0.024, 0.122, 0.048], [0.07, 0.112, 0.036], [0.074, 0.1, 0.03]], 0x14181d, 0.0011);
  tube(inner, [[0.1, 0.075, 0.03], [0.1, 0.02, 0.05], [0.0665, -0.01, 0.04], [0.0665, -0.02, 0.034]], 0xe8a21a, 0.0011);
  [[-0.17, 0.14], [0.17, 0.14], [-0.17, -0.14], [0.17, -0.14]].forEach(([x, y]) => screwHead(inner, x, y, 0.002, 0.003));
}
function relayCube(p, x, y, z, k = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(k); p.add(g);
  box(g, 0.019, 0.0155, 0.0155, 0.0008, mat(0x1b5fb8, { roughness: 0.45 }), 0, 0, 0);
  const l = lbl('relay', 0.0165, 0.0095, '16A 250V', { bg: '#dfe6ee', size: 16, pw: 128, ph: 72 }); l.position.set(0, 0, 0.0079); g.add(l);
  [-0.007, -0.0035, 0, 0.0035, 0.007].forEach((xx) => cyl(g, 0.0006, 0.005, METAL(), xx, -0.0105, -0.004, 5));
  return g;
}
function meterBoard(p, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  box(g, 0.058, 0.04, 0.0016, 0.0003, mat(0x1d4f8f, { roughness: 0.5 }), 0, 0, 0);
  box(g, 0.012, 0.007, 0.0016, 0.0003, mat(0x14181d), -0.012, 0.007, 0.0016); box(g, 0.007, 0.005, 0.0014, 0.0003, mat(0x14181d), 0.004, 0.009, 0.0016);
  box(g, 0.02, 0.011, 0.01, 0.001, mat(0x2f6fd0), 0.0165, -0.0125, 0.005); [0.0095, 0.0235].forEach((xx) => screwHead(g, xx, -0.0125, 0.0105, 0.0022));
  const l = lbl('pzem', 0.026, 0.007, 'METER', { bg: '#d6dbe0', size: 22 }); l.position.set(-0.013, -0.011, 0.0012); g.add(l);
  return g;
}
function currentRing(p, x, y, z) {
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0045, 8, 24), mat(0x15181c, { roughness: 0.6 })); r.position.set(x, y, z); p.add(r);
  cyl(p, 0.0035, 0.03, mat(LIVE), x, y, z, 8).rotation.x = Math.PI / 2;
}
function buildPodInner(inner) {
  box(inner, 0.12, 0.1, 0.002, 0.0006, mat(0xdfe3e7), 0, 0, 0.001);
  meterBoard(inner, -0.026, 0.015, 0.016); currentRing(inner, 0.025, 0.026, 0.018);
  relayCube(inner, 0.025, -0.012, 0.012, 1.6);
  esp32(inner, -0.03, -0.028, 0.016).scale.setScalar(0.62);
  tube(inner, [[0.025, 0.05, 0.006], [0.025, 0.04, 0.018], [0.036, 0.026, 0.018], [0.036, 0.0, 0.02]], LIVE, 0.0022);
  tube(inner, [[0.025, -0.003, 0.012], [0.04, -0.03, 0.016], [0.02, -0.044, 0.014], [0.0, -0.05, 0.01]], LIVE, 0.0022);
  tube(inner, [[0.045, 0.05, 0.006], [0.05, 0.0, 0.016], [0.05, -0.044, 0.012], [0.02, -0.052, 0.01]], NEUT, 0.0022);
  tube(inner, [[0.013, -0.02, 0.014], [-0.002, -0.026, 0.02], [-0.014, -0.03, 0.02], [-0.02, -0.033, 0.018]], 0xe8a21a, 0.0011);
  [[-0.055, 0.045], [0.055, 0.045], [-0.055, -0.045], [0.055, -0.045]].forEach(([x, y]) => screwHead(inner, x, y, 0.002, 0.0025));
}

export function makeHub() {
  const g = new THREE.Group(), shell = mat(0xcfd8e0, { roughness: 0.45, metalness: 0.1 });
  box(g, 0.46, 0.36, 0.012, 0.01, mat(0x8a5a35), 0, 0, 0.006);
  [0.164, -0.164].forEach((y) => box(g, 0.4, 0.012, 0.15, 0.005, shell, 0, y, 0.075));
  [-0.194, 0.194].forEach((x) => box(g, 0.012, 0.3, 0.15, 0.004, shell, x, 0, 0.075));
  const hinge = new THREE.Group(); hinge.position.set(-0.2, 0, 0.152); g.add(hinge);
  box(hinge, 0.4, 0.31, 0.012, 0.012, mat(0xf2f5f8, { roughness: 0.35 }), 0.2, 0, 0.006);
  plain(hinge, 0.34, 0.07, 0.002, new THREE.MeshBasicMaterial({ map: signTex('hubsign', 256, 56, '#14202b', [{ text: 'smartmeter', size: 34, y: 28, font: "'DM Sans',sans-serif", color: '#ffb02e' }]) }), 0.2, 0.105, 0.0125);
  box(hinge, 0.012, 0.03, 0.02, 0.005, mat(0x9aa7b3), 0.385, 0, 0.02);
  const names = ['PWR', 'WI-FI', 'BLE', 'FAULT'], cols = [0x2fd37a, 0x4aa3ff, 0x6aa8ff, 0xff4b4b], leds = {};
  names.forEach((n, i) => {
    const m = new THREE.MeshStandardMaterial({ color: cols[i], emissive: cols[i], emissiveIntensity: 1.6 }); leds[n] = m;
    ball(hinge, 0.011, m, 0.075 + i * 0.083, 0.0, 0.016, 10, 8); glow(hinge, cols[i], 0.09, 0.075 + i * 0.083, 0.0, 0.03, 0.35);
    plain(hinge, 0.06, 0.02, 0.002, new THREE.MeshBasicMaterial({ map: signTex('hl' + n, 96, 32, '#e9eef2', [{ text: n, size: 20, y: 17, font: "'DM Mono',monospace", color: '#2a3340', weight: 500 }]) }), 0.075 + i * 0.083, -0.035, 0.0125);
  });
  plain(hinge, 0.34, 0.07, 0.002, new THREE.MeshBasicMaterial({ map: signTex('hubqr', 96, 24, '#e9eef2', [{ text: '230 V AC · 16 A', size: 14, y: 12, font: "'DM Mono',monospace", color: '#a33', weight: 500 }]) }), 0.2, -0.105, 0.0125);
  cyl(g, 0.007, 0.12, mat(0x15191e), 0.14, 0.24, 0.1, 8);                                                            // antenna
  [-0.12, 0, 0.12].forEach((x, i) => { cyl(g, 0.017, 0.045, mat(0x15191e), x, -0.2, 0.075, 10); cyl(g, i === 1 ? 0.012 : 0.008, 0.1, mat(i === 0 ? 0x1b1b1b : 0x2b3540), x, -0.26, 0.075, 8); });
  const inner = new THREE.Group(); inner.position.set(0, 0, 0.012); g.add(inner); inner.visible = false;
  buildHubInner(inner);
  g.userData = { hinge, inner, leds,
    pins: [
      { label: 'Controller', desc: 'Bluetooth and Wi-Fi. It meters nothing itself: it talks to every plug-point unit and to the cloud. The board is about 5 × 3 cm.', pos: new THREE.Vector3(0.095, 0.115, 0.06) },
      { label: 'Circuit breaker', desc: 'A 32 A breaker. It cuts the whole supply on overload. The rating is set by what the wall wiring can carry.', pos: new THREE.Vector3(-0.152, 0.145, 0.085) },
      { label: 'Earth-leakage protector (RCCB)', desc: 'Trips in milliseconds if current leaks to earth. This is the part that protects a person.', pos: new THREE.Vector3(-0.109, 0.115, 0.085) },
      { label: 'Surge protector', desc: 'Absorbs voltage spikes from the grid. The green window shows it is healthy.', pos: new THREE.Vector3(-0.064, 0.145, 0.085) },
      { label: '5 V power module', desc: 'Turns mains into 5 V for the controller.', pos: new THREE.Vector3(-0.018, 0.125, 0.06) },
      { label: 'Terminals and wiring', desc: 'Live (red), neutral (blue) and earth (green) arrive from the grid through the left gland. One cable carries power and data out to the plug-point units.', pos: new THREE.Vector3(0.0, -0.075, 0.07) },
    ],
  };
  return shadowize(g);
}
export function makePod() {
  const g = new THREE.Group(), shell = mat(0xcfd8e0, { roughness: 0.45, metalness: 0.1 });
  box(g, 0.14, 0.2, 0.085, 0.014, shell, 0, 0, 0.0425);
  const plate = box(g, 0.14, 0.11, 0.01, 0.01, mat(0xeef3f7, { roughness: 0.35, transparent: true, opacity: 1 }), 0, 0.045, 0.09);
  box(g, 0.13, 0.085, 0.012, 0.008, mat(0x2b3541), 0, -0.055, 0.092);
  const sock = cyl(g, 0.027, 0.012, mat(0x20272f), 0, -0.058, 0.1, 20); sock.rotation.x = Math.PI / 2;
  const hole = cyl(g, 0.019, 0.014, mat(0x07090c), 0, -0.058, 0.102, 20); hole.rotation.x = Math.PI / 2;
  const led = new THREE.MeshStandardMaterial({ color: 0x2a323b, emissive: 0x000000, emissiveIntensity: 1 });
  const lr = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 24), led); lr.position.set(0, -0.058, 0.098); g.add(lr);
  const lglow = glow(g, 0xffffff, 0.16, 0, -0.058, 0.12, 0);
  place(g, new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshBasicMaterial({ map: qrTex() })), 0, 0.045, 0.0955);
  const inner = new THREE.Group(); inner.position.set(0, 0.045, 0.012); g.add(inner); inner.visible = false;
  buildPodInner(inner);
  box(g, 0.05, 0.03, 0.04, 0.01, mat(0x15191e), 0, 0.11, 0.04);
  g.userData = { plate, inner, led, lglow, socketLocal: new THREE.Vector3(0, -0.058, 0.108),
    pins: [
      { label: 'Meter', desc: 'Measures volts, amps and units for this plug point only. This is the number the bill comes from.', pos: new THREE.Vector3(-0.026, 0.075, 0.07) },
      { label: 'Relay', desc: 'The switch. Opens when the battery is full, on a power cut, or when the Host stops the session.', pos: new THREE.Vector3(0.027, 0.03, 0.07) },
      { label: 'Small chip', desc: 'Reads the meter, drives the relay and the light ring, and talks to the Box over the data cable.', pos: new THREE.Vector3(-0.03, 0.015, 0.07) },
    ] };
  return shadowize(g);
}

/* ---------- environment ---------- */
function bushings(p, xs, y) { xs.forEach((x) => { cyl(p, 0.03, 0.3, mat(0x7a3b24, { roughness: 0.4 }), x, y, 0, 8); [0.08, 0.16, 0.24].forEach((dy) => cyl(p, 0.052, 0.015, mat(0x7a3b24), x, y - 0.14 + dy, 0, 10)); }); }
export function makeTransformerPole() {
  const g = new THREE.Group(), conc = mat(0x9c9a93, { roughness: 0.9 });
  place(g, new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 8, 12), conc), 0, 4, 0);
  [1.2, 2.6, 4.0].forEach((y) => cyl(g, 0.15, 0.04, mat(0x6e6c66), 0, y, 0, 12));
  box(g, 2.3, 0.09, 0.1, 0.02, mat(0x2b2f35), 0, 6.5, 0); box(g, 0.1, 0.09, 1.0, 0.02, mat(0x2b2f35), 0, 6.5, 0);
  [-0.85, 0, 0.85].forEach((x) => { cyl(g, 0.025, 0.25, mat(0x7a3b24, { roughness: 0.4 }), x, 6.68, 0, 8); [0.64, 0.7, 0.76].forEach((y) => cyl(g, 0.05, 0.015, mat(0x7a3b24), x, y + 5.98, 0, 10)); });
  g.userData = { top: new THREE.Vector3(0, 6.6, 0) };
  return shadowize(g);
}
/* The transformer sits on the station roof so it is always in view and easy to tap. */
export function makeTransformerUnit() {
  const g = new THREE.Group(), steel = mat(0x2b2f35, { roughness: 0.6, metalness: 0.4 });
  [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([x, z]) => cyl(g, 0.04, 0.34, steel, x, 0.17, z, 8));
  box(g, 1.5, 0.1, 1.1, 0.025, steel, 0, 0.36, 0);
  const tank = new THREE.Group(); tank.position.set(0, 0.95, 0); g.add(tank);
  const tm = mat(0x58707f, { roughness: 0.5, metalness: 0.4 });
  cyl(tank, 0.4, 1.1, tm, 0, 0, 0, 24); cyl(tank, 0.43, 0.07, mat(0x44586a, { metalness: 0.4 }), 0, 0.58, 0, 24);
  for (let i = -2; i <= 2; i++) ring(tank, 0.405, 0.022, mat(0x4a5f70, { metalness: 0.4 }), 0, i * 0.2, 0).rotation.x = Math.PI / 2;
  bushings(tank, [-0.18, 0, 0.18], 0.78);
  box(tank, 0.5, 0.3, 0.012, 0.004, mat(0xe0b52a), 0, 0.1, 0.405);
  plain(tank, 0.46, 0.26, 0.002, new THREE.MeshBasicMaterial({ map: signTex('danger', 128, 72, '#e0b52a', [{ text: 'DANGER', size: 28, y: 22, font: "'DM Sans',sans-serif", color: '#7a1010' }, { text: '11 kV · TRANSFORMER', size: 13, y: 52, font: "'DM Mono',monospace", color: '#1b1b1b', weight: 500 }]) }), 0, 0.1, 0.412);
  const glowRing = ring(g, 0.78, 0.03, new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0 }), 0, 1.1, 0); glowRing.rotation.x = Math.PI / 2; glowRing.userData.noShadow = true;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.0, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 1.0, 0); g.add(hit);
  g.userData = { tank, glowRing, hit, hv: [-0.18, 0, 0.18].map((x) => new THREE.Vector3(x, 1.75, 0)), lv: new THREE.Vector3(0.42, 0.7, 0.3) };
  return shadowize(g);
}
export function wire(from, to, sag = 0.5, r = 0.009, color = 0x15181c) {
  const mid = from.clone().lerp(to, 0.5); mid.y -= sag;
  const c = new THREE.QuadraticBezierCurve3(from, mid, to);
  return new THREE.Mesh(new THREE.TubeGeometry(c, 24, r, 5, false), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
}
export function makeWall(width = 14) {
  const g = new THREE.Group();
  plain(g, width, 1.35, 0.3, mat(0x2f6f8f, { roughness: 0.85 }), 0, 0.675, 0); plain(g, width, 0.08, 0.34, mat(0x9a968c), 0, 0.04, 0);
  plain(g, width, 1.9, 0.3, new THREE.MeshStandardMaterial({ map: brickTex([width / 1.4, 1.4]), roughness: 0.95 }), 0, 2.3, 0);
  plain(g, width, 0.1, 0.34, mat(0xbfb7a6), 0, 3.28, 0);
  const roof = plain(g, width + 0.4, 0.05, 1.5, new THREE.MeshStandardMaterial({ map: tinTex([width / 1.2, 1]), roughness: 0.55, metalness: 0.4 }), 0, 3.38, 0.55); roof.rotation.x = 0.1;
  [-1, 1].forEach((s) => plain(g, 0.06, 0.7, 0.06, mat(0x3a2e24), s * (width / 2 - 0.1), 3.0, 1.05));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.0), new THREE.MeshStandardMaterial({
    map: signTex('kesh-sign', 512, 116, '#1f6b4a', [{ text: 'কেষ্টপুর টোটো স্ট্যান্ড', size: 50, y: 44 }, { text: 'KESHTOPUR TOTO STAND · CHARGING POINT', size: 21, y: 92, weight: 600, font: "'DM Sans',sans-serif", color: '#ffd84a' }]), roughness: 0.6 }));
  sign.position.set(0, 2.6, 0.162); g.add(sign);
  [[-5.6, 1.9, 0.9, 1.3], [-4.4, 1.8, 0.7, 1.05], [5.2, 2.0, 0.8, 1.2]].forEach(([x, y, w, h], i) => place(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: posterTex(i), roughness: 0.9 })), x, y, 0.162));
  return shadowize(g, true, true);
}
export function makeStall() {
  const g = new THREE.Group(), wood = mat(0x7a5233, { roughness: 0.85 });
  box(g, 2.0, 0.95, 0.8, 0.03, wood, 0, 0.475, 0); box(g, 2.1, 0.06, 0.9, 0.02, mat(0xcdb79a), 0, 0.98, 0);
  box(g, 1.9, 0.5, 0.02, 0.01, mat(0xc9372c), 0, 0.5, 0.41);
  [-0.95, 0.95].forEach((x) => cyl(g, 0.04, 2.2, wood, x, 1.1, -0.35, 8));
  const roof = plain(g, 2.5, 0.05, 1.6, new THREE.MeshStandardMaterial({ map: tinTex([2, 1]), roughness: 0.55, metalness: 0.4 }), 0, 2.28, 0.1); roof.rotation.x = 0.12;
  box(g, 1.8, 0.04, 0.3, 0.01, wood, 0, 1.55, -0.55);
  [-0.6, -0.3, 0, 0.3, 0.6].forEach((x, i) => cyl(g, 0.07, 0.16, mat([0xd9a441, 0xc9372c, 0x2e8b57, 0x3f6fb5, 0xd9a441][i], { roughness: 0.4 }), x, 1.65, -0.55, 12));
  const stove = box(g, 0.34, 0.14, 0.3, 0.03, mat(0x2a2a2a), 0.45, 1.06, 0.05); cyl(g, 0.12, 0.2, mat(0xb9bec3, { metalness: 0.8, roughness: 0.35 }), 0.45, 1.23, 0.05, 14); cyl(g, 0.02, 0.18, mat(0xb9bec3, { metalness: 0.8 }), 0.6, 1.3, 0.05, 8).rotation.z = -0.9;
  const coal = glow(g, 0xff7a2e, 0.45, 0.45, 1.1, 0.2, 0.55);
  [-0.4, 0.2].forEach((x) => cyl(g, 0.03, 0.07, mat(0xe8e2d0), x, 1.04, 0.15, 10));
  [-0.8, 0.8].forEach((x) => { cyl(g, 0.012, 0.3, mat(0x15181c), x, 2.05, 0.5, 5); ball(g, 0.05, emissive(0xffe2a0, 1.4), x, 1.88, 0.5, 10, 8); glow(g, 0xffd27a, 0.9, x, 1.88, 0.5, 0.5); });
  const stool = cyl(g, 0.2, 0.05, mat(0x7a5233), -1.5, 0.42, 0.5, 12); [-0.12, 0.12].forEach((x) => cyl(g, 0.02, 0.4, wood, -1.5 + x, 0.2, 0.5, 6));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.38), new THREE.MeshStandardMaterial({ map: signTex('chai', 256, 108, '#c9372c', [{ text: 'চা · Tea', size: 48, y: 54 }]), roughness: 0.7 })); board.position.set(0, 2.0, 0.78); g.add(board);
  const router = new THREE.Group(); router.position.set(-0.75, 1.64, -0.55); g.add(router);
  box(router, 0.2, 0.04, 0.14, 0.01, mat(0xf2f4f6), 0, 0.02, 0); [-0.07, 0.07].forEach((x) => cyl(router, 0.006, 0.12, mat(0x15181c), x, 0.1, -0.03, 6));
  const rled = new THREE.MeshStandardMaterial({ color: 0x2fd37a, emissive: 0x2fd37a, emissiveIntensity: 1.6 }); ball(router, 0.008, rled, 0.06, 0.042, 0.07, 8, 6);
  const rhit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); rhit.position.set(0, 0.1, 0); router.add(rhit);
  g.userData = { coal, router, rled, rhit, steamAt: new THREE.Vector3(0.6, 1.4, 0.05) };
  return shadowize(g, true, true);
}
export function makeLamp() {
  const g = new THREE.Group(), steel = mat(0x39434e, { roughness: 0.5, metalness: 0.5 });
  cyl(g, 0.05, 4.2, steel, 0, 2.1, 0, 8, 0.07); const arm = ring(g, 0.5, 0.03, steel, 0.5, 4.05, 0); arm.rotation.z = 0; arm.scale.set(1, 0.6, 1);
  box(g, 0.5, 0.05, 0.05, 0.01, steel, 0.4, 4.25, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd58a, emissiveIntensity: 1.6 })); bulb.position.set(0.85, 4.12, 0); g.add(bulb);
  const gl = glow(g, 0xffc872, 3.0, 0.85, 4.0, 0, 0.9);
  g.userData = { bulb, glow: gl, lightPos: new THREE.Vector3(0.85, 4.0, 0) };
  return shadowize(g);
}
export function makePalm(h = 6) {
  const g = new THREE.Group(), trunkM = mat(0x7b6a52, { roughness: 0.95 });
  let y = 0, bend = 0; for (let i = 0; i < 6; i++) { const seg = cyl(g, 0.12 - i * 0.008, h / 6, trunkM, bend, y + h / 12, 0, 8, 0.14 - i * 0.008); seg.rotation.z = -0.04; y += h / 6; bend += 0.06; }
  const leaf = mat(0x2f7a3c, { roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const f = box(g, 0.28, 0.02, 2.4, 0.005, leaf, 0, 0, 0); const a = (i / 9) * Math.PI * 2; f.position.set(bend + Math.cos(a) * 0.9, h - 0.15, Math.sin(a) * 0.9); f.rotation.set(0.5, -a + Math.PI / 2, 0); f.rotation.order = 'YXZ'; f.rotation.y = -a + Math.PI / 2; f.rotation.x = 0.55; }
  return shadowize(g);
}
export function makeHouses() {
  const g = new THREE.Group(); let x = -26;
  const wm = new THREE.MeshStandardMaterial({ map: windowsTex(), roughness: 0.95 });
  const cols = [0xc9a98a, 0xb98f7a, 0x9fb0a0, 0xd8c9a8, 0xa7a2b8];
  while (x < 26) {
    const w = 2.6 + Math.random() * 2.2, h = 4 + Math.random() * 5;
    const m = wm.clone(); m.color = new THREE.Color(cols[Math.floor(Math.random() * cols.length)]); m.map = windowsTex();
    plain(g, w, h, 2.6, m, x + w / 2, h / 2, -15 - Math.random() * 3);
    plain(g, w + 0.2, 0.12, 2.8, mat(0x4a4a48), x + w / 2, h + 0.05, -15);
    if (Math.random() > 0.4) cyl(g, 0.5, 0.9, mat(0x1b1d20, { roughness: 0.7 }), x + w / 2 + (Math.random() - 0.5), h + 0.55, -15, 12);
    if (Math.random() > 0.5) cyl(g, 0.02, 1.4, mat(0x44474c), x + w / 2 + 0.8, h + 0.8, -14.5, 5);
    x += w + 0.15;
  }
  return g;
}
export function makeDog() {
  const g = new THREE.Group(), fur = mat(0xb08a5c, { roughness: 1 });
  box(g, 0.55, 0.2, 0.26, 0.1, fur, 0, 0.12, 0); ball(g, 0.11, fur, 0.3, 0.12, 0.03); box(g, 0.1, 0.06, 0.12, 0.03, mat(0x4a3a2a), 0.4, 0.1, 0.03);
  box(g, 0.05, 0.1, 0.07, 0.02, mat(0x7a5a3a), 0.26, 0.24, 0.12); cyl(g, 0.025, 0.28, fur, -0.36, 0.1, 0.05, 6).rotation.z = 1.3;
  return shadowize(g);
}
export function makeProps() {
  const g = new THREE.Group();
  const crate = (x, z, r = 0) => { const c = box(g, 0.5, 0.35, 0.5, 0.02, mat(0x8a6238, { roughness: 0.9 }), x, 0.175, z); c.rotation.y = r; return c; };
  crate(-6.2, -2.4, 0.2); crate(-6.15, -2.35, 0.5).position.y = 0.52; crate(-5.5, -2.5, -0.1);
  cyl(g, 0.3, 0.85, mat(0x2f5fa8, { roughness: 0.5, metalness: 0.4 }), 6.6, 0.425, -2.4, 16);
  const bike = new THREE.Group(); bike.position.set(-5.9, 0, -1.7); bike.rotation.y = 0.5; g.add(bike);
  [-0.55, 0.55].forEach((z) => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.015, 6, 20), mat(0x15181c)); w.rotation.y = Math.PI / 2; w.position.set(0, 0.34, z); bike.add(w); });
  box(bike, 0.03, 0.03, 1.1, 0.01, mat(0x9a2f2f), 0, 0.55, 0); box(bike, 0.03, 0.4, 0.03, 0.01, mat(0x9a2f2f), 0, 0.5, -0.45).rotation.x = 0.3; box(bike, 0.5, 0.025, 0.025, 0.008, mat(0x15181c), 0, 0.95, -0.5);
  return shadowize(g);
}
export function curbStones(zLine, x0, x1) {
  const g = new THREE.Group(); let i = 0;
  for (let x = x0; x < x1; x += 0.9) { place(g, new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.22), mat(i++ % 2 ? 0xe5c61d : 0x1b1b1b, { roughness: 0.9 })), x + 0.44, 0.08, zLine); }
  return shadowize(g, false, true);
}
export function bunting(from, to, n = 12) {
  const g = new THREE.Group(); g.add(wire(from, to, 0.45, 0.006, 0x3a2e24));
  const c = new THREE.QuadraticBezierCurve3(from, from.clone().lerp(to, 0.5).setY(Math.min(from.y, to.y) - 0.45 + (Math.max(from.y, to.y) - Math.min(from.y, to.y)) / 2), to);
  const cols = [0xe5484d, 0xf5c518, 0x2fb67c, 0x3d8bff, 0xff8a3d];
  for (let i = 1; i < n; i++) { const t = i / n, p = c.getPoint(t); const f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 3), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.8, side: THREE.DoubleSide })); f.position.set(p.x, p.y - 0.11, p.z); f.rotation.x = Math.PI; g.add(f); }
  return g;
}
export function groundTextures() { return { asphalt: asphaltTex([8, 3]), concrete: concreteTex([9, 6]), shutter: shutterTex() }; }

export function makeCow() {
  const g = new THREE.Group(), hide = mat(0xe9e4d8, { roughness: 1 }), patch = mat(0x7a5a3a, { roughness: 1 });
  box(g, 1.0, 0.55, 0.42, 0.18, hide, 0, 0.85, 0); box(g, 0.34, 0.2, 0.3, 0.06, patch, -0.15, 1.1, 0); box(g, 0.28, 0.3, 0.44, 0.06, patch, 0.25, 0.9, 0);
  box(g, 0.34, 0.3, 0.26, 0.1, hide, 0.62, 1.05, 0); box(g, 0.14, 0.12, 0.2, 0.05, mat(0xc99a8a), 0.8, 0.98, 0);
  [-1, 1].forEach((s) => { cyl(g, 0.015, 0.14, mat(0xe0d8c4), 0.58, 1.26, s * 0.1, 6).rotation.x = s * 0.5; box(g, 0.1, 0.05, 0.03, 0.02, patch, 0.55, 1.14, s * 0.15); });
  [[-0.35, -0.14], [-0.35, 0.14], [0.35, -0.14], [0.35, 0.14]].forEach(([x, z]) => cyl(g, 0.045, 0.62, hide, x, 0.4, z, 8));
  cyl(g, 0.012, 0.5, patch, -0.55, 0.8, 0, 5).rotation.z = 0.2;
  return shadowize(g);
}
export function makeVegCart() {
  const g = new THREE.Group(), wood = mat(0x8a6238, { roughness: 0.9 });
  box(g, 1.5, 0.1, 0.85, 0.02, wood, 0, 0.75, 0); [-1, 1].forEach((s) => cyl(g, 0.34, 0.06, mat(0x15181c), 0, 0.34, s * 0.48, 16).rotation.z = Math.PI / 2);
  cyl(g, 0.02, 1.2, wood, 0.95, 0.6, 0, 6).rotation.z = 1.2; [-1, 1].forEach((s) => box(g, 1.5, 0.12, 0.03, 0.01, wood, 0, 0.86, s * 0.42));
  const cols = [0xd8402e, 0x4aa04a, 0xf0a030, 0x8e3a7a, 0xd8402e, 0x4aa04a];
  for (let i = 0; i < 18; i++) ball(g, 0.07 + (i % 3) * 0.01, mat(cols[i % cols.length], { roughness: 0.6 }), -0.6 + (i % 6) * 0.24, 0.88 + (i % 2) * 0.05, -0.2 + Math.floor(i / 6) * 0.2, 8, 6);
  cyl(g, 0.02, 1.9, mat(0xcfcfcf), -0.5, 1.7, -0.3, 6);
  const um = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.4, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xe5484d, side: THREE.DoubleSide, roughness: 0.8 })); um.position.set(-0.5, 2.6, -0.3); g.add(um);
  return shadowize(g);
}
export function makeNeem() {
  const g = new THREE.Group(); cyl(g, 0.22, 3.2, mat(0x5b4632, { roughness: 1 }), 0, 1.6, 0, 8, 0.32);
  [[0, 3.6, 0, 1.5], [-1.1, 3.3, 0.3, 1.1], [1.1, 3.4, -0.2, 1.2], [0.2, 4.4, 0.2, 1.0], [-0.6, 4.0, -0.7, 1.0], [0.8, 3.9, 0.8, 0.9]].forEach(([x, y, z, r], i) => { const b = ball(g, r, mat([0x3d7d3a, 0x2f6b32, 0x4a8c3d][i % 3], { roughness: 1 }), x, y, z, 10, 8); b.scale.y = 0.8; });
  return shadowize(g);
}
export function makeCrow() {
  const g = new THREE.Group(), m = mat(0x15161a, { roughness: 1 });
  box(g, 0.22, 0.08, 0.1, 0.03, m, 0, 0, 0); const l = box(g, 0.28, 0.01, 0.1, 0.003, m, -0.2, 0.01, 0), r = box(g, 0.28, 0.01, 0.1, 0.003, m, 0.2, 0.01, 0);
  g.userData = { l, r }; return g;
}
