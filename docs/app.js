import * as THREE from './vendor/three.module.min.js';

/* ---------- story ---------- */
const STEPS = [
  { t: 'A Toto pulls up', b: 'Four Sockets, four green lights. The Box is on and waiting. Nothing is switched on until a Driver scans.' },
  { t: 'Scan, then charge', b: 'The Driver scans the QR beside Socket 1. The phone sends a signed token over Bluetooth and the Box checks it by itself, no internet needed.' },
  { t: 'Every Socket is metered', b: 'Each Socket has its own meter and relay. The Host sets the Rate, and the Box keeps a Ledger of every session.' },
  { t: 'Full, so it stops itself', b: 'When the charger tapers off, the session ends on its own. The Driver is billed for exactly the units used and never has to remember to stop.' },
  { t: 'Power cut', b: 'The Box keeps its Ledger. When power comes back, every Socket stays off, so nobody is billed for a vehicle that is not theirs.' },
  { t: 'Power is back, Driver resumes', b: 'Each Driver is told charging stopped. One tap resumes it, and only the charging after the tap is billed to them.' },
  { t: 'No internet? Still fine', b: 'The Box keeps metering with Wi-Fi down. The Host phone carries the Ledger to the cloud over Bluetooth, and nothing is lost.' }
];
const MODES = ['life', 'hardware', 'software'];
const RATE = 10;
const DWELL = 7.2;

const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() {
  document.body.classList.add('nogl');
  $('fallback').hidden = false;
  ['scene', 'labels'].forEach((i) => ($(i).hidden = true));
  document.querySelector('.top').hidden = true;
  $('panel').hidden = true;
  $('fallbackSteps').innerHTML = STEPS.map((s) => `<li><b>${s.t}.</b> ${s.b}</li>`).join('');
}

function main() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return fallback(); }
  if (!renderer.getContext()) return fallback();

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 140);

  const windows = [];
  /* ----- helpers ----- */
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0.05, flatShading: true }, o));
  const add = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const bx = (p, w, h, d, m, x, y, z) => add(p, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
  const cyl = (p, r, h, m, x, y, z, seg = 14) => add(p, new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m), x, y, z);
  const sph = (p, r, m, x, y, z) => add(p, new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m), x, y, z);
  const c = (h) => new THREE.Color(h);

  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = (p, color, size, x, y, z, op = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op }));
    s.scale.set(size, size, 1); s.position.set(x, y, z); p.add(s); return s;
  };

  /* ----- sky, fog, stars ----- */
  const sky = (() => {
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
    const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0f2742'); gr.addColorStop(0.55, '#2f5a73'); gr.addColorStop(0.85, '#e69b62'); gr.addColorStop(1, '#f4b774');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  scene.background = sky;
  scene.fog = new THREE.Fog(0x4b6f80, 26, 70);
  {
    const n = 160, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = 0.25 + Math.random() * 0.9, r = 80;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = -Math.abs(Math.sin(a)) * Math.cos(e) * r - 10;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.7, fog: false })));
  }

  /* ----- lights ----- */
  const hemi = new THREE.HemisphereLight(0xb9d0ea, 0x39465a, 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc89a, 1.5); sun.position.set(-9, 9, 7); scene.add(sun);
  const lampLights = [];

  /* ----- ground and set dressing ----- */
  const world = new THREE.Group(); scene.add(world);
  {
    const ground = bx(world, 60, 0.4, 44, M(0x232d37), 0, -0.2, -2);
    bx(world, 60, 0.38, 14, M(0x2e5b4f), 0, -0.22, -14);   // grass at the back
    bx(world, 22, 0.02, 10, M(0x2a3540), 0, 0.01, 1.2);     // bay apron
    const line = M(0xe9eef2, { roughness: 0.6 });
    [-4.8, -2.4, 0, 2.4, 4.8].forEach((x) => bx(world, 0.07, 0.02, 3.6, line, x, 0.03, -0.1));
    bx(world, 9.7, 0.02, 0.07, line, 0, 0.03, 1.7);
    [-3.6, -1.2, 1.2, 3.6].forEach((x) => bx(world, 1.4, 0.14, 0.18, M(0xb8c2cc), x, 0.07, -1.9)); // wheel stops
    // hills
    [[-16, -22, 9], [-4, -26, 11], [10, -24, 10], [20, -21, 8]].forEach(([x, z, s]) => {
      const h = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.7, 7), M(0x2a5a56, { flatShading: true })); h.position.set(x, s * 0.2, z); world.add(h);
    });
    // trees
    [[-10, -9], [-8, -11], [9, -9.5], [11, -11], [-13, -7], [13, -7], [-5.5, -9.5], [6, -11.5]].forEach(([x, z], i) => {
      const t = new THREE.Group(); cyl(t, 0.14, 1, M(0x5a3e2b), 0, 0.5, 0, 6);
      const s = 1 + (i % 3) * 0.25;
      add(t, new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 1.8 * s, 7), M(i % 2 ? 0x2f7a5c : 0x3a8a62)), 0, 1.7 * s, 0);
      add(t, new THREE.Mesh(new THREE.ConeGeometry(0.7 * s, 1.4 * s, 7), M(i % 2 ? 0x3a8a62 : 0x2f7a5c)), 0, 2.5 * s, 0);
      t.position.set(x, 0, z); world.add(t);
    });
    // shed with the Box on its front wall
    const shed = new THREE.Group(); world.add(shed);
    bx(shed, 11, 3.4, 2.4, M(0xd9c8a8), 0, 1.7, -5.5);
    bx(shed, 11.8, 0.25, 3.2, M(0x3d4a58), 0, 3.5, -5.4);
    bx(shed, 11.8, 0.1, 0.12, M(0x2b3541), 0, 3.35, -3.84);
    for (const wx of [-4.2, 4.2]) { const w = bx(shed, 1.3, 1.0, 0.06, M(0xffe6b0, { emissive: 0xffc872, emissiveIntensity: 0.9 }), wx, 1.9, -4.28); windows.push(w); }
    // lamp posts
    [[-6.2, -2.4], [6.2, -2.4]].forEach(([x, z]) => {
      const l = new THREE.Group(); cyl(l, 0.07, 4.2, M(0x39434e), 0, 2.1, 0, 8);
      bx(l, 0.9, 0.08, 0.08, M(0x39434e), 0.4, 4.2, 0);
      const bulb = sph(l, 0.14, M(0xfff0c8, { emissive: 0xffd58a, emissiveIntensity: 1.6 }), 0.8, 4.12, 0);
      const g = glow(l, 0xffc872, 3.2, 0.8, 4.0, 0, 0.9);
      const pl = new THREE.PointLight(0xffc27a, 14, 12, 1.6); pl.position.set(x + 0.8, 4, z); scene.add(pl);
      lampLights.push({ pl, g, bulb, base: 14 });
      l.position.set(x, 0, z); world.add(l);
    });
  }

  /* ----- the Box ----- */
  const BOXY = 1.75, BOXZ = -4.05, SOCKX = [-1.2, -0.4, 0.4, 1.2], BAYX = [-3.6, -1.2, 1.2, 3.6];
  const boxG = new THREE.Group(); boxG.position.set(0, BOXY, BOXZ); world.add(boxG);
  const shellMat = M(0xdfe6ec, { roughness: 0.5 });
  const panelMat = M(0xeef3f7, { roughness: 0.4, transparent: true, opacity: 1 });
  bx(boxG, 3.5, 2.1, 0.06, M(0x9aa7b3), 0, 0, -0.22);     // back plate
  bx(boxG, 3.5, 0.06, 0.5, shellMat, 0, 1.05, 0);          // top
  bx(boxG, 3.5, 0.06, 0.5, shellMat, 0, -1.05, 0);         // bottom
  bx(boxG, 0.06, 2.1, 0.5, shellMat, -1.72, 0, 0);
  bx(boxG, 0.06, 2.1, 0.5, shellMat, 1.72, 0, 0);
  const front = bx(boxG, 3.4, 2.04, 0.05, panelMat, 0, 0, 0.24);
  bx(boxG, 3.62, 0.18, 0.62, M(0x3d4a58), 0, 1.16, 0);    // rain hood
  const qrTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#111';
    const n = 9, s = 64 / n; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rnd() > 0.5) g.fillRect(x * s, y * s, s, s);
    [[0, 0], [6, 0], [0, 6]].forEach(([qx, qy]) => { g.fillStyle = '#fff'; g.fillRect(qx * s, qy * s, 3 * s, 3 * s); g.fillStyle = '#111'; g.fillRect(qx * s, qy * s, 3 * s, 3 * s); g.fillStyle = '#fff'; g.fillRect((qx + .5) * s, (qy + .5) * s, 2 * s, 2 * s); g.fillStyle = '#111'; g.fillRect((qx + 1) * s, (qy + 1) * s, s, s); });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const ledMats = [], ledGlows = [], socketPos = [];
  SOCKX.forEach((x, i) => {
    cyl(boxG, 0.2, 0.08, M(0x222a33), x, -0.45, 0.3, 20).rotation.x = Math.PI / 2;
    cyl(boxG, 0.13, 0.1, M(0x0e1217), x, -0.45, 0.31, 20).rotation.x = Math.PI / 2;
    [-0.045, 0.045].forEach((dx) => bx(boxG, 0.025, 0.07, 0.04, M(0xc9d1d8, { metalness: 0.6 }), x + dx, -0.4, 0.36));
    add(boxG, new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: qrTex })), x, -0.85, 0.272);
    const lm = M(0x2a323b, { emissive: 0x000000, emissiveIntensity: 1 });
    sph(boxG, 0.085, lm, x, 0.0, 0.29); ledMats.push(lm);
    const gl = glow(boxG, 0xffffff, 0.7, x, 0.0, 0.36, 0); ledGlows.push(gl);
    socketPos.push(new THREE.Vector3(x, BOXY - 0.45, BOXZ + 0.4));
  });
  bx(boxG, 3.0, 0.015, 0.02, M(0x6c7a88), 0, 0.2, 0.275);

  /* internals (hardware view) */
  const inner = new THREE.Group(); boxG.add(inner); inner.visible = false;
  const hwLabels = [];
  {
    const pcb = M(0x1e8f5a, { roughness: 0.5 }), blue = M(0x2f6fd0), black = M(0x14181d), white = M(0xf2f4f6), cop = M(0xd49a4a, { metalness: 0.6, roughness: 0.4 });
    // controller
    bx(inner, 1.15, 0.5, 0.05, pcb, -0.95, 0.62, -0.1); bx(inner, 0.45, 0.28, 0.06, M(0xc3ccd4, { metalness: 0.7 }), -0.8, 0.62, -0.06);
    bx(inner, 0.3, 0.05, 0.04, M(0x333b44), -1.2, 0.62, -0.06);
    // power module and breakers
    bx(inner, 0.5, 0.5, 0.22, M(0x2a3340), 0.15, 0.62, -0.05);
    bx(inner, 0.32, 0.55, 0.22, white, 0.85, 0.62, -0.05); bx(inner, 0.32, 0.55, 0.22, white, 1.22, 0.62, -0.05);
    bx(inner, 0.1, 0.12, 0.05, M(0xd33a3a), 0.85, 0.62, 0.07); bx(inner, 0.1, 0.12, 0.05, M(0x3a7bd3), 1.22, 0.62, 0.07);
    SOCKX.forEach((x) => {
      bx(inner, 0.32, 0.3, 0.14, blue, x, 0.0, -0.08);                    // meter
      bx(inner, 0.28, 0.26, 0.2, black, x, -0.45, -0.05);                 // relay
      cyl(inner, 0.012, 0.35, cop, x, -0.22, -0.05, 6);
      cyl(inner, 0.012, 0.5, M(0x4aa3ff), x + 0.12, 0.28, -0.05, 6);       // signal to controller
    });
    bx(inner, 3.0, 0.03, 0.03, cop, 0, -0.2, -0.16);                      // live bus
    [['Controller · Bluetooth + Wi-Fi', -0.95, 1.05], ['Meter × 4', -0.4, 0.3], ['Relay × 4', 0.4, -0.2], ['Breaker + RCCB', 1.05, 1.05]].forEach(([t, x, y]) => hwLabels.push({ t, pos: new THREE.Vector3(x, BOXY + y, BOXZ + 0.3) }));
  }

  /* ----- cars, drivers, host, cloud ----- */
  const CAR_COLORS = [0xf5b942, 0x3fb68b, 0x4f8de8, 0xe5605a];
  function makeToto(color) {
    const g = new THREE.Group();
    const body = M(color), dark = M(0x1d232b), glass = M(0xbfe3ff, { transparent: true, opacity: 0.45, roughness: 0.1 });
    bx(g, 1.1, 0.22, 2.2, dark, 0, 0.42, 0.05);
    bx(g, 1.15, 0.55, 1.45, body, 0, 0.82, 0.38);
    bx(g, 0.95, 0.62, 0.5, body, 0, 0.75, -0.8);
    bx(g, 0.9, 0.34, 0.04, glass, 0, 1.2, -1.04);
    bx(g, 1.3, 0.08, 1.6, M(0x20262e), 0, 1.78, 0.3);
    [[-0.56, -0.62], [0.56, -0.62], [-0.56, 1.0], [0.56, 1.0]].forEach(([x, z]) => cyl(g, 0.03, 0.9, dark, x, 1.3, z, 6));
    bx(g, 1.05, 0.5, 0.06, M(0x2a313a), 0, 1.0, 1.1);
    [[0, 0.28, -0.85], [-0.55, 0.28, 0.95], [0.55, 0.28, 0.95]].forEach(([x, y, z]) => { const w = cyl(g, 0.28, 0.16, M(0x14181c), x, y, z, 14); w.rotation.z = Math.PI / 2; });
    cyl(g, 0.05, 0.1, M(0x333b44), 0, 0.72, -1.2, 10).rotation.x = Math.PI / 2;   // charge port
    const soc = bx(g, 0.04, 0.1, 0.5, M(0x3d8bff, { emissive: 0x3d8bff, emissiveIntensity: 0 }), 0.6, 0.85, 0.4); // battery strip
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.set(0.9, 1.4, 1); shadow.position.set(0, 0.02, 0.1); g.add(shadow);
    g.userData.soc = soc;
    return g;
  }
  function makePerson(shirt, hat) {
    const g = new THREE.Group();
    cyl(g, 0.17, 0.8, M(shirt), 0, 0.75, 0, 10); cyl(g, 0.15, 0.5, M(0x2b3440), 0, 0.25, 0, 10);
    sph(g, 0.17, M(0xd9a27b), 0, 1.3, 0);
    if (hat) { const h = sph(g, 0.18, M(hat), 0, 1.38, 0); h.scale.y = 0.55; }
    const phone = bx(g, 0.12, 0.2, 0.02, M(0x0c1015, { emissive: 0x3d8bff, emissiveIntensity: 0.9 }), 0.14, 1.0, -0.2);
    phone.rotation.x = -0.4; g.userData.phone = phone;
    const pg = glow(g, 0x6aa8ff, 0.55, 0.14, 1.0, -0.22, 0.7); g.userData.phoneGlow = pg;
    return g;
  }
  const bays = BAYX.map((x, i) => {
    const car = makeToto(CAR_COLORS[i]); car.position.set(x, 0, 16); world.add(car);
    const drv = makePerson([0x2f9e8f, 0xd08a2e, 0x8e63c4, 0xc45a6a][i]); drv.position.set(x + 1.05, 0, 0.55); drv.scale.setScalar(0.001); world.add(drv);
    // cable
    const cable = new THREE.Mesh(new THREE.BufferGeometry(), M(0x15191e, { roughness: 0.5 })); cable.visible = false; world.add(cable);
    const pulses = [0, 1].map(() => glow(world, 0x74b4ff, 0.32, 0, 0, 0, 0));
    return { i, x, car, drv, cable, pulses, curve: null, state: 'empty', soc: 0, cap: [5.2, 4.4, 3.8, 4.8][i], base: [540, 500, 470, 520][i], watts: 0, led: 'ready', plug: 0, token: 0, bubble: '', pop: 0 };
  });
  function buildCable(b) {
    const a = socketPos[b.i].clone().add(new THREE.Vector3(0, 0, 0.1)), e = new THREE.Vector3(b.x, 0.72, -1.2);
    const curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(0, -0.18, 0.45)), new THREE.Vector3((a.x + e.x) / 2, 0.14, (a.z + e.z) / 2), e.clone().add(new THREE.Vector3(0, -0.05, -0.4)), e]);
    b.curve = curve; b.cable.geometry.dispose(); b.cable.geometry = new THREE.TubeGeometry(curve, 28, 0.035, 6, false);
  }

  const host = makePerson(0x2c7fb8, 0xffc233); host.position.set(-6.6, 0, -1.4); host.scale.setScalar(1.12); host.rotation.y = 0.5; world.add(host);
  const cloud = new THREE.Group(); cloud.position.set(7.4, 6.6, -6);
  { const cm = M(0xf0f5fa, { emissive: 0x8fb4d6, emissiveIntensity: 0.5 }); [[0, 0, 0, 1.0], [-1, -0.2, 0, 0.7], [1.0, -0.15, 0, 0.8], [0.4, 0.5, 0, 0.7], [-0.4, 0.35, 0.1, 0.6]].forEach(([x, y, z, r]) => sph(cloud, r, cm, x, y, z)); glow(cloud, 0x9cc7ff, 5, 0, 0, 0, 0.5); }
  world.add(cloud);

  /* ----- data links ----- */
  const boxTop = new THREE.Vector3(0, BOXY + 1.2, BOXZ);
  const wifiCurve = new THREE.QuadraticBezierCurve3(boxTop, new THREE.Vector3(3.6, 7, -5), cloud.position.clone().add(new THREE.Vector3(-1.2, -0.8, 0)));
  const hostPhone = new THREE.Vector3(-6.45, 1.15, -1.7);
  const bleHostCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.2, BOXY + 0.3, BOXZ + 0.4), new THREE.Vector3(-4, 3.4, -2.8), hostPhone);
  const hostCloudCurve = new THREE.QuadraticBezierCurve3(hostPhone, new THREE.Vector3(-1, 8.4, -5), cloud.position.clone().add(new THREE.Vector3(-1.6, -0.4, 0)));
  function makeFlow(curve, color, n, size) {
    const g = new THREE.Group(); world.add(g);
    const s = []; for (let k = 0; k < n; k++) s.push(glow(g, color, size, 0, 0, 0, 0));
    const pts = curve.getPoints(40), line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }));
    g.add(line); return { curve, s, line, on: 0, vis: 0 };
  }
  const flows = { wifi: makeFlow(wifiCurve, 0xffd27a, 8, 0.45), ble: makeFlow(bleHostCurve, 0x6aa8ff, 6, 0.4), hostCloud: makeFlow(hostCloudCurve, 0x6aa8ff, 6, 0.4) };
  const tokenFlows = bays.map((b) => {
    const from = new THREE.Vector3(b.x + 1.0, 1.0, 0.4), to = socketPos[b.i].clone();
    const f = makeFlow(new THREE.QuadraticBezierCurve3(from, new THREE.Vector3((from.x + to.x) / 2, 3.2, -1.6), to), 0x6aa8ff, 5, 0.38); return f;
  });
  /* ledger plates (software view) */
  const ledgerG = new THREE.Group(); ledgerG.position.set(0, BOXY + 2.0, BOXZ + 0.3); world.add(ledgerG);
  const plates = []; for (let k = 0; k < 6; k++) { const p = bx(ledgerG, 1.5, 0.12, 0.7, M(0x2a3b52, { emissive: 0x3d8bff, emissiveIntensity: 0.0, transparent: true, opacity: 0.9 }), 0, k * 0.18, 0); plates.push(p); }
  ledgerG.visible = false;

  /* ----- labels ----- */
  const labelsEl = $('labels');
  const labs = [];
  function addLabel(cls, getPos, getHtml, vis) {
    const el = document.createElement('div'); el.className = 'lab ' + cls; labelsEl.appendChild(el);
    const l = { el, getPos, getHtml, vis, last: '' }; labs.push(l); return l;
  }
  bays.forEach((b) => addLabel('bay', () => new THREE.Vector3(b.x, 2.3 + (b.i % 2) * 0.55, b.car.position.z - 0.1), () => {
    if (b.state === 'empty') return '';
    const u = b.soc * b.cap;
    if (mobile) return `<b>S${b.i + 1}</b> <span class="v">${Math.round(b.watts)} W</span><br>${u.toFixed(1)} u${b.state === 'done' ? ` <span class="v">₹${(u * RATE).toFixed(0)}</span>` : ''}`;
    if (!power) return `<b>Socket ${b.i + 1}</b> · No power<br>${u.toFixed(2)} units`;
    if (b.state === 'done') return `<b>Socket ${b.i + 1}</b> · Done<br>${u.toFixed(2)} units · <span class="v">₹${(u * RATE).toFixed(0)}</span>`;
    if (b.state === 'cut') return `<b>Socket ${b.i + 1}</b> · Stopped<br>${u.toFixed(2)} units`;
    if (b.state === 'resumeWait') return `<b>Socket ${b.i + 1}</b> · Needs a tap<br>${u.toFixed(2)} units`;
    if (b.state === 'charging') return `<b>Socket ${b.i + 1}</b><br><span class="v">${Math.round(b.watts)} W</span> · ${u.toFixed(2)} units`;
    return `<b>Socket ${b.i + 1}</b> · Free`;
  }, () => mode !== 'hardware'));
  addLabel('host', () => new THREE.Vector3(-6.6, 2.35, -1.4), () => mobile ? `<b>Host</b> · <span class="v">${Math.max(0, Math.round(1000 - bays.reduce((s, b) => s + b.soc * b.cap, 0)))}</span> units` : `<b>Host</b><br>₹${RATE} per unit · <span class="v">${Math.max(0, Math.round(1000 - bays.reduce((s, b) => s + b.soc * b.cap, 0)))}</span> units left`, () => mode !== 'hardware');
  addLabel('cloud', () => new THREE.Vector3(7.4, 8.1, -6), () => `<b>Cloud</b><br>${ledger.cloud} of ${ledger.box} entries`, () => mode !== 'hardware');
  addLabel('box', () => new THREE.Vector3(0, BOXY + 2.2, BOXZ), () => `<b>Box</b> · ${power ? (wifi ? 'online' : 'offline') : 'no power'}<br>Ledger <span class="v">${ledger.box}</span> entries`, () => mode === 'life');
  hwLabels.forEach((h) => addLabel('hw', () => h.pos, () => `<b>${h.t}</b>`, () => mode === 'hardware'));
  const bubbles = bays.map((b) => addLabel('bub', () => new THREE.Vector3(b.x + 1.05, 1.95, 0.55), () => b.bubble, () => !!b.bubble && mode !== 'hardware'));

  /* ----- state, tweens, scheduler ----- */
  let power = true, wifi = true, mode = 'life', instant = false;
  const ledger = { box: 1, cloud: 1, acc: 0 };
  const tweens = [], timers = [];
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function tw(obj, key, to, dur, opt = {}) {
    if (instant || dur <= 0) { obj[key] = to; opt.done && opt.done(); return; }
    tweens.push({ obj, key, from: obj[key], to, dur, t: -(opt.delay || 0), done: opt.done });
  }
  function after(sec, fn) { if (instant) fn(); else timers.push({ t: sec, fn }); }
  function stepTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i]; w.t += dt; if (w.t < 0) continue;
      const k = Math.min(1, w.t / w.dur); w.obj[w.key] = w.from + (w.to - w.from) * ease(k);
      if (k >= 1) { tweens.splice(i, 1); w.done && w.done(); }
    }
    for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers.splice(i, 1)[0].fn; f(); } }
  }
  const lights = { amb: 1, lamp: 1, exp: 1 };

  function resetWorld() {
    tweens.length = 0; timers.length = 0;
    power = true; wifi = true; lights.amb = 1; lights.lamp = 1;
    ledger.box = 1; ledger.cloud = 1;
    bays.forEach((b) => {
      b.state = 'empty'; b.pop = 0; b.soc = 0; b.watts = 0; b.led = 'ready'; b.plug = 0; b.bubble = ''; b.token = 0;
      b.car.position.z = 16; b.cable.visible = false;
    });
    Object.values(flows).forEach((f) => (f.on = 0)); tokenFlows.forEach((f) => (f.on = 0));
  }
  function arrive(b, delay = 0) { tw(b.car.position, 'z', 0, 2.4, { delay }); tw(b, 'pop', 1, 0.5, { delay: delay + 1.6 }); b.state = 'waiting'; }
  function plugIn(b) { buildCable(b); b.cable.visible = true; if (instant) b.plug = 1; else tw(b, 'plug', 1, 0.6); }
  function startCharge(b) { b.state = 'charging'; b.led = 'charging'; b.token = instant ? 0 : 1.8; ledger.box += 1; }
  function syncNow() { ledger.cloud = ledger.box; }

  const RUN = [
    () => { arrive(bays[0]); },
    () => { plugIn(bays[0]); after(0.5, () => startCharge(bays[0])); tw(bays[0], 'soc', 0.12, 5.5, { delay: 0.8 }); },
    () => {
      arrive(bays[1], 0.2); arrive(bays[2], 1.0);
      after(2.0, () => { plugIn(bays[1]); startCharge(bays[1]); });
      after(3.2, () => { plugIn(bays[2]); startCharge(bays[2]); });
      tw(bays[0], 'soc', 0.62, 6.5); tw(bays[1], 'soc', 0.4, 5, { delay: 2.2 }); tw(bays[2], 'soc', 0.25, 3.8, { delay: 3.4 });
    },
    () => {
      tw(bays[0], 'soc', 1, 5.2); tw(bays[1], 'soc', 0.62, 6); tw(bays[2], 'soc', 0.5, 6);
      after(5.3, () => { bays[0].state = 'done'; bays[0].led = 'ready'; ledger.box += 1; });
    },
    () => {
      after(1.2, () => {
        power = false; lights.amb = 0; lights.lamp = 0;
        [1, 2].forEach((i) => { bays[i].state = 'cut'; });
        bays.forEach((b) => (b.led = 'off'));
      });
    },
    () => {
      after(0.6, () => {
        power = true; lights.amb = 1; lights.lamp = 1; ledger.box += 2; bays[0].led = 'ready'; bays[3].led = 'ready';
        [1, 2].forEach((i) => { bays[i].state = 'resumeWait'; bays[i].led = 'amber'; bays[i].bubble = 'Charging stopped. Tap to resume'; });
      });
      after(3.6, () => {
        [1, 2].forEach((i) => { bays[i].bubble = 'Resumed'; bays[i].state = 'charging'; bays[i].led = 'charging'; ledger.box += 1; });
        tw(bays[1], 'soc', 0.8, 3); tw(bays[2], 'soc', 0.66, 3);
      });
      after(5.6, () => { [1, 2].forEach((i) => (bays[i].bubble = '')); });
    },
    () => {
      after(0.4, () => { wifi = false; });
      after(1.4, () => { ledger.box += 3; });
      after(2.6, () => { flows.ble.on = 3.2; flows.hostCloud.on = 3.2; });
      after(5.0, () => { syncNow(); });
    }
  ];

  /* ----- camera ----- */
  const cam = { az: 0.42, pol: 1.16, r: 17, tx: 0, ty: 1.3, tz: -0.8 };
  const goal = { az: 0.42, pol: 1.16, r: 17, tx: 0, ty: 1.3, tz: -0.8 };
  let dragAz = 0, dragPol = 0, zoomK = 1, vw = 1, vh = 1, mobile = false;
  function fitRadius() {
    const aspect = vw / vh, hfov = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * aspect);
    return Math.min(36, Math.max(14, 10.5 / Math.tan(hfov / 2) + 2));
  }
  function setGoal() {
    if (mode === 'hardware') Object.assign(goal, { az: 0.1, pol: 1.27, r: Math.min(16, Math.max(6, 2.3 / Math.tan(Math.atan(Math.tan(camera.fov * Math.PI / 360) * (vw / vh))) + 0.8)), tx: 0, ty: BOXY + 0.05, tz: BOXZ });
    else if (mode === 'software') Object.assign(goal, { az: 0.3, pol: 1.0, r: fitRadius() * 0.95, tx: 0, ty: 2.4, tz: -2 });
    else Object.assign(goal, { az: 0.42, pol: 1.16, r: fitRadius(), tx: 0, ty: 1.3, tz: -0.8 });
    dragAz = 0; dragPol = 0; zoomK = 1;
  }
  function resize() {
    vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh;
    const ph = $('panel').getBoundingClientRect().height;
    if (mobile) camera.setViewOffset(vw, vh, 0, Math.round(ph * 0.5), vw, vh); else camera.setViewOffset(vw, vh, -Math.round(Math.min(190, vw * 0.12)), 30, vw, vh);
    camera.updateProjectionMatrix(); setGoal();
  }
  addEventListener('resize', resize);

  const cvs = $('scene'); const ptr = new Map(); let lastPinch = 0;
  cvs.addEventListener('pointerdown', (e) => { cvs.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
  cvs.addEventListener('pointermove', (e) => {
    const p = ptr.get(e.pointerId); if (!p) return;
    if (ptr.size === 2) {
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a, b] = [...ptr.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch) zoomK = Math.min(1.5, Math.max(0.55, zoomK * (lastPinch / d))); lastPinch = d; return;
    }
    dragAz -= (e.clientX - p.x) * 0.005; dragPol -= (e.clientY - p.y) * 0.004;
    dragAz = Math.max(-0.9, Math.min(0.9, dragAz)); dragPol = Math.max(-0.35, Math.min(0.3, dragPol));
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const endPtr = (e) => { ptr.delete(e.pointerId); lastPinch = 0; };
  cvs.addEventListener('pointerup', endPtr); cvs.addEventListener('pointercancel', endPtr);
  cvs.addEventListener('wheel', (e) => { e.preventDefault(); zoomK = Math.min(1.5, Math.max(0.55, zoomK * (1 + e.deltaY * 0.001))); }, { passive: false });

  /* ----- UI wiring ----- */
  let step = 0, playing = !reduced, clock = 0;
  const dots = $('dots');
  STEPS.forEach((s, i) => { const b = document.createElement('button'); b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + s.t); b.onclick = () => go(i); dots.appendChild(b); });
  function paintUI() {
    $('stepNo').textContent = `Step ${step + 1} of ${STEPS.length}`; $('stepTitle').textContent = STEPS[step].t; $('stepBody').textContent = STEPS[step].b;
    [...dots.children].forEach((d, i) => { d.className = i === step ? 'on' : i < step ? 'done' : ''; d.setAttribute('aria-selected', i === step); });
    $('play').textContent = playing ? 'Pause' : 'Play';
  }
  function go(i) {
    step = (i + STEPS.length) % STEPS.length; clock = 0;
    resetWorld(); instant = true;
    for (let k = 0; k < step; k++) RUN[k]();
    if (reduced) RUN[step]();
    instant = false;
    Object.values(flows).forEach((f) => (f.on = 0)); tokenFlows.forEach((f) => (f.on = 0)); bays.forEach((b) => (b.token = 0));
    if (!reduced) RUN[step]();
    paintUI();
  }
  $('prev').onclick = () => go(step - 1);
  $('next').onclick = () => go(step + 1);
  $('play').onclick = () => { playing = !playing; clock = 0; paintUI(); };
  addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(step + 1); else if (e.key === 'ArrowLeft') go(step - 1); else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); $('play').click(); } });
  document.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => {
    mode = b.dataset.mode; document.querySelectorAll('.seg button').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    inner.visible = mode === 'hardware'; panelMat.opacity = mode === 'hardware' ? 0.14 : 1; ledgerG.visible = mode === 'software'; setGoal();
  }));

  /* ----- frame loop ----- */
  const LEDC = { ready: 0x2fd37a, charging: 0x3d8bff, amber: 0xffb02e, off: 0x000000 };
  const tmp = new THREE.Vector3(), tmpc = new THREE.Color();
  let last = performance.now(), time = 0, visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    stepTweens(dt);
    if (playing && !reduced) { clock += dt; if (clock > DWELL) go(step + 1); }

    // bays
    bays.forEach((b, i) => {
      const taper = b.soc < 0.85 ? 1 : Math.max(0.03, (1 - b.soc) / 0.15);
      b.watts = power && b.state === 'charging' ? b.base * taper : 0;
      const car = b.car; car.rotation.z = 0;
      car.userData.soc.material.emissiveIntensity = b.state === 'empty' ? 0 : 0.4 + b.soc * 1.4;
      // ledge: LED
      const on = power && b.led !== 'off';
      let k = 1; if (b.led === 'charging') k = 0.65 + 0.35 * Math.sin(time * 4); if (b.led === 'amber') k = Math.sin(time * 7) > 0 ? 1 : 0.15;
      tmpc.set(LEDC[b.led] || 0); ledMats[i].emissive.copy(tmpc); ledMats[i].emissiveIntensity = on ? 1.6 * k : 0; ledMats[i].color.set(on ? tmpc : 0x2a323b);
      ledGlows[i].material.color.copy(tmpc); ledGlows[i].material.opacity = on ? 0.9 * k : 0;
      // cable pulses
      b.pulses.forEach((p, n) => { const show = b.curve && b.cable.visible && b.state === 'charging' && power; p.material.opacity = show ? 0.9 : 0; if (show) { try { p.position.copy(b.curve.getPoint((time * 0.55 + n * 0.5) % 1)); } catch (err) { p.material.opacity = 0; } } });
      // token flow
      const tf = tokenFlows[i]; tf.on = b.token > 0 ? b.token : 0; if (b.token > 0) b.token -= dt;
      // driver phone pulse
      b.drv.userData.phoneGlow.material.opacity = 0.5 + 0.3 * Math.sin(time * 3 + i) + (b.token > 0 ? 0.5 : 0);
      b.drv.userData.phone.material.emissiveIntensity = b.bubble || b.token > 0 ? 1.8 : 0.8;
      b.drv.rotation.y = -0.5; b.drv.scale.setScalar(Math.max(0.001, b.pop));
    });
    host.userData.phoneGlow.material.opacity = 0.55 + 0.25 * Math.sin(time * 3);

    // ledger sync (Wi-Fi)
    if (wifi && power && ledger.cloud < ledger.box) { ledger.acc += dt * 4; while (ledger.acc >= 1 && ledger.cloud < ledger.box) { ledger.cloud++; ledger.acc--; } }

    // flows
    flows.wifi.on = wifi && power && (ledger.cloud < ledger.box || mode === 'software' || Math.sin(time * 0.8) > 0.2) ? 1 : 0;
    if (flows.ble.on > 0) flows.ble.on -= dt; if (flows.hostCloud.on > 0) flows.hostCloud.on -= dt;
    const fl = [flows.wifi, flows.ble, flows.hostCloud, ...tokenFlows];
    fl.forEach((f, n) => {
      const act = f.on > 0;
      f.vis += ((act ? 1 : 0) - f.vis) * Math.min(1, dt * 6);
      f.line.material.opacity = f.vis * (mode === 'software' ? 0.55 : 0.18);
      f.s.forEach((s, k) => { s.material.opacity = f.vis * 0.95; if (f.vis > 0.02) s.position.copy(f.curve.getPoint((time * 0.45 + k / f.s.length) % 1)); });
    });
    // wifi broken marker
    // ledger plates
    plates.forEach((p, k) => { const tot = Math.min(6, Math.ceil(ledger.box / 3)), syn = Math.min(6, Math.ceil(ledger.cloud / 3)); p.material.emissiveIntensity = k < syn ? 0.9 : k < tot ? 0.35 : 0; p.material.opacity = k < tot ? 0.95 : 0.12; p.position.y = k * 0.18 + Math.sin(time * 1.5 + k) * 0.01; });

    // lighting
    const tgtAmb = lights.amb ? 1.25 : 0.3, tgtLamp = lights.lamp ? 1 : 0, tgtExp = lights.amb ? (mode === 'software' ? 0.82 : mode === 'hardware' ? 1.1 : 1.08) : 0.62;
    hemi.intensity += (tgtAmb - hemi.intensity) * Math.min(1, dt * 5); sun.intensity += (tgtAmb * 1.3 - sun.intensity) * Math.min(1, dt * 5);
    lights.exp += (tgtExp - lights.exp) * Math.min(1, dt * 5); renderer.toneMappingExposure = lights.exp;
    lampLights.forEach((l) => { l.pl.intensity += (tgtLamp * l.base - l.pl.intensity) * Math.min(1, dt * 8); l.g.material.opacity = 0.9 * (l.pl.intensity / l.base); l.bulb.material.emissiveIntensity = 1.6 * (l.pl.intensity / l.base); });
    const winOn = lights.lamp ? 0.9 : 0.05; windows.forEach((w) => (w.material.emissiveIntensity = winOn));

    // camera
    ['az', 'pol', 'r', 'tx', 'ty', 'tz'].forEach((k) => {
      const g = k === 'az' ? goal.az + dragAz : k === 'pol' ? goal.pol + dragPol : k === 'r' ? goal.r * zoomK : goal[k];
      cam[k] += (g - cam[k]) * Math.min(1, dt * 4.5);
    });
    camera.position.set(cam.tx + cam.r * Math.sin(cam.pol) * Math.sin(cam.az), cam.ty + cam.r * Math.cos(cam.pol), cam.tz + cam.r * Math.sin(cam.pol) * Math.cos(cam.az));
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    // gentle idle sway
    if (!reduced && ptr.size === 0) camera.position.x += Math.sin(time * 0.25) * 0.15;

    renderer.render(scene, camera);

    // labels
    labs.forEach((l) => {
      const show = l.vis();
      const html = show ? l.getHtml() : '';
      if (!show || !html) { if (l.last !== '') { l.el.style.display = 'none'; l.last = ''; } return; }
      tmp.copy(l.getPos()).project(camera);
      if (tmp.z > 1) { l.el.style.display = 'none'; return; }
      if (html !== l.last) { l.el.innerHTML = html; l.last = html; }
      l.el.style.display = 'block';
      const half = (l.el.offsetWidth || 90) / 2 + 6;
      const sx = Math.max(half, Math.min(vw - half, (tmp.x * 0.5 + 0.5) * vw)), sy = (-tmp.y * 0.5 + 0.5) * vh;
      l.el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,-100%)`;
    });
  }
  /* setViewOffset shifts the image; labels follow the projected position automatically */

  resize(); go(0); requestAnimationFrame(frame);
  window.__smartmeter = { bays, go, setMode: (m) => document.querySelector(`.seg [data-mode=${m}]`).click() };
}
main();
