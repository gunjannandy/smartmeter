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
export function makeHub() {
  const g = new THREE.Group(), shell = mat(0xcfd8e0, { roughness: 0.45, metalness: 0.1 });
  box(g, 0.46, 0.36, 0.012, 0.01, mat(0x8a5a35), 0, 0, 0.006);
  [[0, 0.164, 0.4, 0.012], [0, -0.164, 0.4, 0.012]].forEach(([x, y, w, h]) => box(g, w, h, 0.15, 0.005, shell, x, y, 0.075));
  [-0.194, 0.194].forEach((x) => box(g, 0.012, 0.3, 0.15, 0.004, shell, x, 0, 0.075));
  const hinge = new THREE.Group(); hinge.position.set(-0.2, 0, 0.152); g.add(hinge);
  box(hinge, 0.4, 0.31, 0.012, 0.012, mat(0xf2f5f8, { roughness: 0.35 }), 0.2, 0, 0.006);
  plain(hinge, 0.34, 0.1, 0.002, new THREE.MeshBasicMaterial({ map: signTex('hubsign', 256, 80, '#14202b', [{ text: 'smartmeter', size: 38, y: 40, font: "'DM Sans',sans-serif", color: '#ffb02e' }]) }), 0.2, 0.06, 0.0125);
  const led = new THREE.MeshStandardMaterial({ color: 0x2fd37a, emissive: 0x2fd37a, emissiveIntensity: 1.6 }); ball(hinge, 0.012, led, 0.34, -0.1, 0.014, 10, 8);
  cyl(g, 0.007, 0.12, mat(0x15191e), 0.14, 0.24, 0.1, 8);                                                                                  // antenna
  cyl(g, 0.016, 0.05, mat(0x15191e), 0, -0.2, 0.075, 10);                                                                                  // cable gland
  const inner = new THREE.Group(); inner.position.set(0, 0, 0.012); g.add(inner); inner.visible = false;
  const white = mat(0xf2f4f6), pcb = mat(0x1e8f5a), metal = mat(0xc3ccd4, { metalness: 0.7 });
  box(inner, 0.34, 0.012, 0.008, 0.002, mat(0x9aa7b3, { metalness: 0.6 }), 0, 0.02, 0.004);
  box(inner, 0.036, 0.085, 0.07, 0.004, white, -0.13, 0.02, 0.04); box(inner, 0.014, 0.02, 0.012, 0.003, mat(0x222a33), -0.13, 0.04, 0.078);
  box(inner, 0.036, 0.085, 0.07, 0.004, white, -0.09, 0.02, 0.04); box(inner, 0.012, 0.012, 0.012, 0.003, mat(0x3a7bd3), -0.09, 0.04, 0.078);
  box(inner, 0.034, 0.02, 0.015, 0.003, mat(0x2a3340), -0.03, 0.04, 0.012);
  box(inner, 0.051, 0.028, 0.003, 0.001, pcb, 0.06, 0.04, 0.014); box(inner, 0.018, 0.016, 0.003, 0.001, metal, 0.075, 0.04, 0.017);
  box(inner, 0.3, 0.004, 0.004, 0.001, mat(0xd33a3a), 0, -0.07, 0.022); box(inner, 0.3, 0.004, 0.004, 0.001, mat(0x14181d), 0, -0.08, 0.022);
  g.userData = { hinge, inner, led };
  return shadowize(g);
}
export function makePod() {
  const g = new THREE.Group(), shell = mat(0xcfd8e0, { roughness: 0.45, metalness: 0.1 });
  box(g, 0.14, 0.2, 0.085, 0.014, shell, 0, 0, 0.0425);
  const plate = box(g, 0.14, 0.11, 0.01, 0.01, mat(0xeef3f7, { roughness: 0.35, transparent: true, opacity: 1 }), 0, 0.045, 0.09);        // electronics cover
  box(g, 0.13, 0.085, 0.012, 0.008, mat(0x2b3541), 0, -0.055, 0.092);                                                                    // socket ledge
  const sock = cyl(g, 0.027, 0.012, mat(0x20272f), 0, -0.058, 0.1, 20); sock.rotation.x = Math.PI / 2;
  const hole = cyl(g, 0.019, 0.014, mat(0x07090c), 0, -0.058, 0.102, 20); hole.rotation.x = Math.PI / 2;
  const led = new THREE.MeshStandardMaterial({ color: 0x2a323b, emissive: 0x000000, emissiveIntensity: 1 });
  const lr = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 24), led); lr.position.set(0, -0.058, 0.098); g.add(lr);
  const lglow = glow(g, 0xffffff, 0.16, 0, -0.058, 0.12, 0);
  place(g, new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshBasicMaterial({ map: qrTex() })), 0, 0.045, 0.0955);        // QR sticker
  const inner = new THREE.Group(); inner.position.set(0, 0.045, 0.012); g.add(inner); inner.visible = false;
  box(inner, 0.06, 0.04, 0.015, 0.003, mat(0x2f6fd0), -0.02, 0.01, 0.01); box(inner, 0.05, 0.026, 0.019, 0.003, mat(0x14181d), 0.02, -0.025, 0.01);
  box(inner, 0.035, 0.02, 0.003, 0.001, mat(0x1e8f5a), 0.03, 0.03, 0.005); cyl(inner, 0.002, 0.05, mat(0xd33a3a), -0.04, -0.01, 0.02, 6);
  box(g, 0.05, 0.03, 0.04, 0.01, mat(0x15191e), 0, 0.11, 0.04);
  g.userData = { plate, inner, led, lglow, socketLocal: new THREE.Vector3(0, -0.058, 0.108) };
  return shadowize(g);
}

/* ---------- environment ---------- */
export function makeTransformerPole() {
  const g = new THREE.Group(), conc = mat(0x9c9a93, { roughness: 0.9 });
  place(g, new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 8, 12), conc), 0, 4, 0);
  [1.2, 2.6, 4.0].forEach((y) => cyl(g, 0.15, 0.04, mat(0x6e6c66), 0, y, 0, 12));
  const arm = box(g, 2.3, 0.09, 0.1, 0.02, mat(0x2b2f35), 0, 6.5, 0); box(g, 0.1, 0.09, 1.0, 0.02, mat(0x2b2f35), 0, 6.5, 0);
  [-0.85, 0, 0.85].forEach((x) => { cyl(g, 0.025, 0.25, mat(0x7a3b24, { roughness: 0.4 }), x, 6.68, 0, 8); [0.64, 0.7, 0.76].forEach((y) => cyl(g, 0.05, 0.015, mat(0x7a3b24), x, y + 5.98, 0, 10)); });
  [-0.55, 0.55].forEach((s) => box(g, 0.07, 0.07, 1.2, 0.01, mat(0x2b2f35), s, 4.25, 0.5));
  box(g, 1.1, 0.07, 1.0, 0.015, mat(0x2b2f35), 0, 4.3, 0.55);
  const tank = new THREE.Group(); tank.position.set(0, 4.9, 0.55); g.add(tank);
  const tm = mat(0x58707f, { roughness: 0.5, metalness: 0.4 });
  cyl(tank, 0.4, 1.1, tm, 0, 0, 0, 24); cyl(tank, 0.43, 0.07, mat(0x44586a, { metalness: 0.4 }), 0, 0.58, 0, 24);
  for (let i = -2; i <= 2; i++) ring(tank, 0.405, 0.022, mat(0x4a5f70, { metalness: 0.4 }), 0, i * 0.2, 0).rotation.x = Math.PI / 2;
  [-0.18, 0, 0.18].forEach((x) => { cyl(tank, 0.03, 0.3, mat(0x7a3b24, { roughness: 0.4 }), x, 0.78, 0, 8); [0.7, 0.78, 0.86].forEach((y) => cyl(tank, 0.052, 0.015, mat(0x7a3b24), x, y, 0, 10)); });
  box(tank, 0.22, 0.14, 0.012, 0.004, mat(0xe0b52a), 0, 0.1, 0.405);
  const warn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 3), new THREE.MeshStandardMaterial({ color: 0xd62323 })); warn.rotation.x = Math.PI / 2; warn.position.set(0, -0.15, 0.41); tank.add(warn);
  const glowRing = ring(tank, 0.62, 0.025, new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0 }), 0, 0, 0); glowRing.rotation.x = Math.PI / 2; glowRing.userData.noShadow = true;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.4, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 5.2, 0.3); g.add(hit);
  g.userData = { tank, glowRing, hit, top: new THREE.Vector3(0, 6.6, 0), tankTop: new THREE.Vector3(0, 5.6, 0.55) };
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
    map: signTex('toto-sign', 512, 116, '#1f6b4a', [{ text: 'টোটো স্ট্যান্ড', size: 54, y: 44 }, { text: 'TOTO STAND · CHARGING POINT', size: 22, y: 92, weight: 600, font: "'DM Sans',sans-serif", color: '#ffd84a' }]), roughness: 0.6 }));
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
