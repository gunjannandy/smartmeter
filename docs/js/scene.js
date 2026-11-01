import { THREE, mat, glow, shadowize, dispose, tex, asphaltTex, concreteTex, plain, box, cyl, ball, place } from './gfx.js';
import * as M from './models.js';

/* The Toto stand, in metres. Camera looks from the street toward the wall with the Box on it. */
const WALLZ = -3.0, CARZ = -0.75, QUEUE_Z = 5.2;
const X6 = [-4.75, -2.85, -0.95, 0.95, 2.85, 4.75], ORDER = [2, 3, 1, 4, 0, 5];
const slotX = (i) => X6[ORDER[i]];
const QX_WIDE = [-2.4, -0.8, 0.8, 2.4, 4.0, -4.0], QX_NARROW = [-1.5, -0.5, 0.5, 1.5, 2.5, -2.5];
let QX = QX_WIDE;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LEDC = { green: 0x2fd37a, blue: 0x3d8bff, amber: 0xffb02e, red: 0xff4b4b };

export function createScene({ canvas, labelsEl, sim, game, onTap, onPin, onQuality, quality = 'high' }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = sim.state;
  let q = quality;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = q === 'high'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(q === 'high' ? Math.min(devicePixelRatio || 1, 2) : 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.2, 160);

  /* ---------- sky, environment, lights ---------- */
  const skyTex = tex('sky', 4, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#16284a'); gr.addColorStop(0.45, '#4a5f86'); gr.addColorStop(0.72, '#e9a06a'); gr.addColorStop(0.9, '#f6c27e'); gr.addColorStop(1, '#f9d79a');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  });
  scene.background = skyTex; scene.fog = new THREE.Fog(0xe2a77a, 26, 70);
  let envTex = null;
  try {
    const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })));
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); sunBall.position.set(-30, 10, 28); env.add(sunBall);
    envTex = pm.fromScene(env, 0.03).texture; pm.dispose();
  } catch (e) { /* the scene still works without reflections */ }
  const hemi = new THREE.HemisphereLight(0xcfd9ee, 0x6a5a4a, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffcf9a, 2.4); sun.position.set(-9, 10, 12); sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
  sun.castShadow = q === 'high'; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 9, bottom: -9, near: 1, far: 45 });
  const rim = new THREE.DirectionalLight(0x7fa8ff, 0.5); rim.position.set(10, 6, -8); scene.add(rim);
  const lampLights = [];

  /* ---------- ground ---------- */
  const world = new THREE.Group(); scene.add(world);
  /* Moving dots show what flows where: amber = electricity, blue = data. */
  const lanes = [];
  function makeLane(curve, color, n, size, speed, opts = {}) {
    const g = new THREE.Group(); world.add(g); const sp = []; for (let k = 0; k < n; k++) sp.push(glow(g, color, size, 0, 0, 0, 0));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 })); g.add(line);
    const L = { g, curve, s: sp, line, speed, vis: 0, target: 0, t: null, temp: !!opts.temp }; lanes.push(L); return L;
  }
  function updateLanes(dt, time) {
    for (let k = lanes.length - 1; k >= 0; k--) {
      const L = lanes[k];
      if (L.t != null) { L.t -= dt; L.target = L.t > 0 ? 1 : 0; }
      L.vis += (L.target - L.vis) * Math.min(1, dt * 6); L.line.material.opacity = L.vis * 0.32;
      L.s.forEach((sp, n) => { sp.material.opacity = L.vis * 0.95; if (L.vis > 0.02) { const f = (((time * L.speed + n / L.s.length) % 1) + 1) % 1; try { sp.position.copy(L.curve.getPoint(f)); } catch (err) { sp.material.opacity = 0; } } });
      if (L.temp && L.t != null && L.t <= 0 && L.vis < 0.03) { world.remove(L.g); L.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); lanes.splice(k, 1); }
    }
  }
  const ground = (w, d, x, z, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, 0, z); p.receiveShadow = true; world.add(p); return p; };
  ground(70, 12, 0, 10.2, new THREE.MeshStandardMaterial({ map: asphaltTex([14, 3]), roughness: 0.95 }));
  ground(70, 8.0, 0, 0.4, new THREE.MeshStandardMaterial({ map: concreteTex([18, 2]), roughness: 0.95 }));
  ground(70, 40, 0, -23, new THREE.MeshStandardMaterial({ color: 0x3f5a3a, roughness: 1 }));
  for (let x = -16; x < 16; x += 2.4) plain(world, 1.2, 0.01, 0.14, mat(0xe8e2c0, { roughness: 0.9 }), x, 0.012, 9.2);
  X6.concat([-6.65, 6.65]).forEach((x) => plain(world, 0.07, 0.012, 3.1, mat(0xf3efe0, { roughness: 0.8 }), x, 0.014, -0.75));
  plain(world, 13.3, 0.012, 0.07, mat(0xf3efe0, { roughness: 0.8 }), 0, 0.014, 0.8);
  X6.forEach((x) => plain(world, 1.0, 0.1, 0.14, mat(0xb8b2a4), x, 0.05, -2.25));
  world.add(M.curbStones(4.4, -14, 14));

  /* ---------- street dressing ---------- */
  const wall = M.makeWall(18); wall.position.set(0, 0, WALLZ - 0.15); world.add(wall);
  const stall = M.makeStall(); stall.position.set(7.2, 0, WALLZ + 0.65); world.add(stall);
  const routerHit = stall.userData.router.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.material.opacity === 0);
  routerHit.userData.pick = { type: 'router' };
  const houses = M.makeHouses(); world.add(houses);
  [[-9.8, -5.5], [10.4, -6.5], [-12.5, -10]].forEach(([x, z], i) => { const p = M.makePalm(5.5 + i); p.position.set(x, 0, z); p.rotation.y = i * 1.3; world.add(p); });
  const props = M.makeProps(); world.add(props);
  const neem = M.makeNeem(); neem.position.set(-10.2, 0, -3.2); world.add(neem);
  const cow = M.makeCow(); cow.position.set(-9.6, 0, 7.4); cow.rotation.y = 0.35; world.add(cow);
  const cart = M.makeVegCart(); cart.position.set(-9.0, 0, 1.4); cart.rotation.y = 0.5; world.add(cart);
  [[6.1, -0.8, -0.9, 0x2f6fb5, 0xc9372c], [6.8, -0.5, -2.3, 0xd9d4c4, 0x6a4a2a], [8.7, -1.0, -2.6, 0x5b7fc4, 0x8d3b3b]].forEach(([x, z, r, shirt, cap], i) => { const p = M.makePerson({ shirt, skin: i + 1, gamchha: i === 1, cap: i === 1 ? null : cap, phone: false }); p.position.set(x, 0, z); p.rotation.y = r; world.add(p); });
  const crows = []; for (let k = 0; k < 4; k++) { const c = M.makeCrow(); c.userData.k = k; world.add(c); crows.push(c); }
  glow(scene, 0xffb86b, 46, -24, 5, -38, 0.85); glow(scene, 0xffd9b0, 26, 8, 14, -40, 0.22); glow(scene, 0xffc9a0, 22, -14, 17, -36, 0.2); glow(scene, 0xffd9b0, 30, 22, 12, -38, 0.18);
  const dog = M.makeDog(); dog.position.set(-5.9, 0, -2.3); dog.rotation.y = 0.6; world.add(dog);
  [[-5.6, 2.2], [5.6, 2.2]].forEach(([x, z]) => {
    const l = M.makeLamp(); l.position.set(x, 0, z); if (x > 0) l.rotation.y = Math.PI; world.add(l);
    const pl = new THREE.PointLight(0xffc27a, 9, 11, 1.7); pl.position.set(x + (x > 0 ? -0.85 : 0.85), 4.0, z); scene.add(pl);
    lampLights.push({ pl, g: l.userData.glow, bulb: l.userData.bulb, base: 9 });
  });
  world.add(M.bunting(new THREE.Vector3(-5.1, 4.05, 2.2), new THREE.Vector3(-7.9, 3.15, WALLZ + 0.4), 14));
  world.add(M.bunting(new THREE.Vector3(5.1, 4.05, 2.2), new THREE.Vector3(8.0, 3.15, WALLZ + 0.4), 14));
  // utility pole at the left, and the transformer on the station roof: tap it to cut the power
  const pole = M.makeTransformerPole(); pole.position.set(-7.4, 0, -0.9); world.add(pole);
  const unit = M.makeTransformerUnit(); unit.position.set(-2.7, 3.45, WALLZ + 0.2); unit.userData.hit.userData.pick = { type: 'transformer' }; world.add(unit);
  unit.updateMatrixWorld(true);
  const tankWorld = new THREE.Vector3(); unit.userData.tank.getWorldPosition(tankWorld);
  const hvWorld = unit.userData.hv.map((v) => unit.localToWorld(v.clone())), lvWorld = unit.localToWorld(unit.userData.lv.clone());
  [-0.85, 0, 0.85].forEach((dx, i) => {
    world.add(M.wire(new THREE.Vector3(-7.4 + dx, 6.62, -0.9), hvWorld[i], 0.9));
    world.add(M.wire(new THREE.Vector3(-7.4 + dx, 6.62, -0.9), new THREE.Vector3(-14, 6.1 - i * 0.3, -2 + i * 2), 0.9));
  });
  world.add(M.wire(new THREE.Vector3(-7.4, 6.55, -0.4), new THREE.Vector3(-14, 5.2, 3), 0.8, 0.012));
  const feedFrom = lvWorld.clone(), feedTo = new THREE.Vector3(-0.12, M.HUB_Y + 0.2, WALLZ + 0.12);
  world.add(M.wire(feedFrom, feedTo, 0.5, 0.014, 0x2a2d33));

  /* ---------- Box, plug-point units, trunk ---------- */
  const hub = M.makeHub(); hub.position.set(0, M.HUB_Y, WALLZ); world.add(hub);
  const hubHit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hubHit.position.set(0, 0, 0.2); hubHit.userData.pick = { type: 'box' }; hub.add(hubHit);
  const beacon = glow(hub, 0xffb02e, 1.1, 0, 0, 0.3, 0);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 10), mat(0x7b8590, { roughness: 0.5, metalness: 0.4 })); trunk.rotation.z = Math.PI / 2; trunk.position.set(0, M.POD_Y + 0.2, WALLZ + 0.05); world.add(trunk);
  const drop = cyl(world, 0.018, M.HUB_Y - 0.18 - (M.POD_Y + 0.2), mat(0x7b8590, { metalness: 0.4 }), 0, (M.HUB_Y - 0.18 + M.POD_Y + 0.2) / 2, WALLZ + 0.05, 10);
  const pods = [];
  const socketWorld = (i) => { const p = pods[i].group.localToWorld(pods[i].group.userData.socketLocal.clone()); return p; };
  function addPodMesh(i, animate) {
    const g = M.makePod(); g.position.set(slotX(i), M.POD_Y, WALLZ); g.userData.pick = { type: 'pod', i };
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.3), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 0, 0.1); hit.userData.pick = { type: 'pod', i }; g.add(hit);
    world.add(g); const stub = cyl(world, 0.014, 0.1, mat(0x7b8590, { metalness: 0.4 }), slotX(i), M.POD_Y + 0.15, WALLZ + 0.05, 8);
    const px = slotX(i), zz = WALLZ + 0.07, pts = [new THREE.Vector3(0, M.HUB_Y - 0.2, zz), new THREE.Vector3(0, M.POD_Y + 0.2, zz), new THREE.Vector3(px, M.POD_Y + 0.2, zz), new THREE.Vector3(px, M.POD_Y + 0.1, zz)];
    const eLane = makeLane(new THREE.CatmullRomCurve3(pts), 0xffc247, 5, 0.13, 0.6), dLane = makeLane(new THREE.CatmullRomCurve3(pts.slice().reverse().map((p) => p.clone().add(new THREE.Vector3(0, 0.025, 0.02)))), 0x5aa9ff, 3, 0.1, 0.45);
    pods[i] = { group: g, stub, drop: animate ? 0 : 1, x: px, open: 0, eLane, dLane };
    if (animate) { g.scale.setScalar(0.01); }
    refreshTrunk();
  }
  function refreshTrunk() {
    const xs = pods.map((p) => p.x).concat([0]); const a = Math.min(...xs), b = Math.max(...xs);
    trunk.scale.y = Math.max(0.2, b - a + 0.2); trunk.position.x = (a + b) / 2;
  }
  for (let i = 0; i < S.sockets.length; i++) addPodMesh(i, false);

  /* ---------- Wi-Fi cloud and data flows ---------- */
  const cloud = new THREE.Group(); cloud.position.set(7.4, 6.6, -6.5); world.add(cloud);
  { const cm = new THREE.MeshStandardMaterial({ color: 0xf6f9fc, emissive: 0xa5c2dd, emissiveIntensity: 0.5, roughness: 1 }); [[0, 0, 0, 0.9], [-0.9, -0.2, 0, 0.62], [0.9, -0.15, 0, 0.7], [0.35, 0.45, 0, 0.62], [-0.4, 0.3, 0.1, 0.55]].forEach(([x, y, z, r]) => ball(cloud, r, cm, x, y, z, 14, 10)); glow(cloud, 0xbcd7ff, 4.5, 0, 0, 0, 0.45); }
  const host = M.makePerson({ shirt: 0xf1eee4, pants: 0x3a3a3a, skin: 2, cap: 0xf6f3ea, phone: true }); host.position.set(4.7, 0, -1.7); host.rotation.y = 0.5; host.userData.pick = { type: 'host' }; world.add(host);
  const hubTop = new THREE.Vector3(0, M.HUB_Y + 0.2, WALLZ + 0.1), hostPhone = new THREE.Vector3(4.9, 1.1, -1.9);
  const gridLane = makeLane(new THREE.QuadraticBezierCurve3(feedFrom, feedFrom.clone().lerp(feedTo, 0.5).add(new THREE.Vector3(0, -0.5, 0.2)), feedTo), 0xffc247, 7, 0.24, 0.5);
  const wifiLane = makeLane(new THREE.QuadraticBezierCurve3(hubTop, new THREE.Vector3(3, 6, -4.5), cloud.position.clone().add(new THREE.Vector3(-1, -0.7, 0))), 0x5aa9ff, 8, 0.26, 0.4);
  const bleLane = makeLane(new THREE.QuadraticBezierCurve3(hubTop, new THREE.Vector3(2.6, 3, -2.6), hostPhone), 0x5aa9ff, 6, 0.22, 0.45);
  const upLane = makeLane(new THREE.QuadraticBezierCurve3(hostPhone, new THREE.Vector3(6, 5.2, -4), cloud.position.clone().add(new THREE.Vector3(-0.6, -0.5, 0))), 0x5aa9ff, 6, 0.22, 0.45);
  const tokenLanes = [];
  let syncFlash = 0;

  /* ---------- vehicles ---------- */
  const entries = [];            // all vehicle objects in the world
  const bayEntry = [];           // sim bay -> entry
  let variantCount = 0;
  function newEntry(type, key) {
    const kind = type === 'scooter' ? 'scooter' : 'toto', variant = variantCount++;
    const group = kind === 'toto' ? M.makeToto(variant) : M.makeScooter(variant);
    shadowize(group, true, true);
    if (envTex) group.traverse((o) => { if (o.material && o.material.isMeshStandardMaterial) { o.material.envMap = envTex; o.material.envMapIntensity = 0.55; } });
    const hb = new THREE.Mesh(kind === 'toto' ? new THREE.BoxGeometry(1.7, 2.2, 3.0) : new THREE.BoxGeometry(1.1, 1.6, 2.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hb.position.set(0, kind === 'toto' ? 1.1 : 0.8, 0.1); hb.userData.noShadow = true; group.add(hb);
    const e = { key, type: kind, group, mode: 'enter', p: 0, qx: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), person: null, bay: -1, cable: null, plug: null, motes: [], spin: 0, standing: false };
    group.userData.pick = null; world.add(group); entries.push(e); return e;
  }
  function removeEntry(e) {
    if (e.cable) { dispose(e.cable); e.cable = null; } if (e.plug) { dispose(e.plug); e.plug = null; }
    e.motes.forEach((m) => { if (m.parent) m.parent.remove(m); }); e.motes = [];
    if (e.person) { dispose(e.person); e.person = null; }
    dispose(e.group); const i = entries.indexOf(e); if (i >= 0) entries.splice(i, 1); if (e.bay >= 0 && bayEntry[e.bay] === e) bayEntry[e.bay] = null;
  }
  function queueEntry(id) { return entries.find((e) => e.key === 'q' + id); }
  game.on('queue', (qd) => {
    const e = newEntry(qd.type, 'q' + qd.id); e.mode = 'enter'; e.qid = qd.id; e.group.userData.pick = { type: 'queue', id: qd.id };
    const side = qd.id % 2 ? -1 : 1; e.group.position.set(side * 20, 0, QUEUE_Z); e.group.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  game.on('parked', ({ id, bay }) => {
    let e = queueEntry(id); if (!e) { e = newEntry('toto', 'q' + id); e.group.position.set(QX[0], 0, QUEUE_Z); }
    e.mode = 'park'; e.p = 0; e.bay = bay; e.qid = null; bayEntry[bay] = e; e.group.userData.pick = { type: 'vehicle', i: bay };
    e.from.copy(e.group.position); e.to.set(slotX(bay), 0, CARZ); e.vid = S.sockets[bay].vid;
  });
  game.on('upset', (qd) => { const e = queueEntry(qd.id); if (e) { e.mode = 'leave'; e.p = 0.4; e.upset = true; e.group.userData.pick = null; e.qid = null; } });
  function adoptStray(i) {
    const e = newEntry(S.sockets[i].vehicle.type, 'b' + S.sockets[i].vid); e.mode = 'park'; e.p = 0; e.bay = i; bayEntry[i] = e; e.vid = S.sockets[i].vid;
    e.group.userData.pick = { type: 'vehicle', i }; e.group.position.set(-20, 0, QUEUE_Z); e.from.copy(e.group.position); e.to.set(slotX(i), 0, CARZ);
  }
  function standDriver(e, i) {
    e.person = M.makePerson({ shirt: [0x2f9e8f, 0xd08a2e, 0x8e63c4, 0xc45a6a, 0x5b7fc4, 0x7da34a][i % 6], skin: i, gamchha: i % 2 === 0, pants: 0x2b3440 });
    e.person.position.set(slotX(i) + 1.0, 0, CARZ + 0.3); e.person.rotation.y = -0.4; e.person.scale.setScalar(0.01); e.person.userData.pick = { type: 'driver', i }; world.add(e.person);
    const pb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 0.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); pb.position.set(0, 1.0, 0); pb.userData.noShadow = true; e.person.add(pb);
    e.group.userData.seated.visible = false; e.standing = true;
  }
  function buildCable(e) {
    e.group.updateMatrixWorld(true); pods[e.bay].group.updateMatrixWorld(true);
    const i = e.bay, s0 = socketWorld(i), port = e.group.localToWorld(e.group.userData.port.clone());
    const pts = [s0.clone(), s0.clone().add(new THREE.Vector3(0, -0.12, 0.12)), new THREE.Vector3(s0.x, 0.05, s0.z + 0.35), new THREE.Vector3((s0.x + port.x) / 2, 0.03, (s0.z + port.z) / 2),
      new THREE.Vector3(port.x, 0.04, port.z - 0.25), port];
    e.curve = new THREE.CatmullRomCurve3(pts);
    e.cable = new THREE.Mesh(new THREE.TubeGeometry(e.curve, 40, 0.012, 6, false), new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.5 })); world.add(e.cable);
    e.plug = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.045), mat(0x20262e)); e.plug.position.copy(s0).add(new THREE.Vector3(0, 0, 0.03)); world.add(e.plug);
    for (let k = 0; k < 2; k++) e.motes.push(glow(world, 0xffc247, 0.22, 0, 0, 0, 0));
  }
  function spinWheels(e, dist) { (e.group.userData.wheels || []).forEach((w) => { w.rotation.x -= dist / 0.25; }); }

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(cx, cy) {
    ndc.set((cx / vw) * 2 - 1, -(cy / vh) * 2 + 1); ray.setFromCamera(ndc, camera);
    const roots = [hub, unit, host, stall, ...pods.map((p) => p.group), ...entries.map((e) => e.group), ...entries.filter((e) => e.person).map((e) => e.person)];
    const hits = ray.intersectObjects(roots, true);
    for (const h of hits) { let o = h.object; while (o) { if (o.userData && o.userData.pick) return o.userData.pick; o = o.parent; } }
    return null;
  }

  /* ---------- camera ---------- */
  const cam = { az: 0.34, pol: 1.12, r: 15, tx: 0, ty: 1.0, tz: 0.8 }, goal = Object.assign({}, cam);
  let focus = { kind: 'main', i: 0 }, dragAz = 0, dragPol = 0, zoomK = 1, vw = 1, vh = 1, ins = { top: 0, bottom: 0, left: 0, right: 0 }, hintPan = 0;
  /* Distance that fits a box of half-width hw and half-height hh into the part of the screen the HUD leaves free. */
  const fit = (hw, hh, depth) => {
    const t = Math.tan((camera.fov * Math.PI) / 360), fw = Math.max(0.5, (vw - 0.5 * (ins.left + ins.right)) / vw), fh = Math.max(0.35, (vh - ins.top - ins.bottom) / vh);
    return clamp(Math.max(hw / (t * camera.aspect * fw), hh / (t * fh)) + depth, 0.5, 44);
  };
  function activeHalfWidth() { const xs = pods.map((p) => Math.abs(p.x)); return Math.max(3.3, Math.max(...xs) + 1.5); }
  function setGoal() {
    const f = focus;
    if (f.kind === 'hub') Object.assign(goal, { az: 0.14, pol: 1.5, r: fit(0.36, 0.27, 0.12), tx: -0.02, ty: M.HUB_Y, tz: WALLZ + 0.1 });
    else if (f.kind === 'pod' && pods[f.i]) Object.assign(goal, { az: 0.12, pol: 1.5, r: fit(0.12, 0.13, 0.1), tx: pods[f.i].x, ty: M.POD_Y, tz: WALLZ + 0.05 });
    else if (f.kind === 'vehicle' && bayEntry[f.i]) Object.assign(goal, { az: 0.5, pol: 1.15, r: fit(1.9, 1.7, 2.2), tx: slotX(f.i), ty: 1.0, tz: CARZ - 0.4 });
    else Object.assign(goal, { az: 0.3, pol: camera.aspect < 0.85 ? 1.0 : 1.12, r: fit(camera.aspect < 0.85 ? Math.min(activeHalfWidth(), 3.1) : camera.aspect < 1.3 ? 5.0 : 7.2, 3.4, 2.0), tx: 0, ty: 1.1, tz: 0.8 });
    dragAz = 0; dragPol = 0; zoomK = 1; camera.near = f.kind === 'hub' || f.kind === 'pod' ? 0.04 : 0.3; camera.updateProjectionMatrix();
  }
  function resize() {
    vw = innerWidth; vh = innerHeight; renderer.setSize(vw, vh, false); camera.aspect = vw / vh;
    QX = vw / vh < 0.8 ? QX_NARROW : QX_WIDE; camera.setViewOffset(vw, vh, Math.round((ins.right - ins.left) / 2), Math.round((ins.bottom - ins.top) / 2), vw, vh); camera.updateProjectionMatrix(); setGoal();
  }
  addEventListener('resize', resize);
  const ptr = new Map(); let lastPinch = 0, downAt = null;
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); downAt = { x: e.clientX, y: e.clientY, moved: false }; });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptr.get(e.pointerId);
    if (!p) { if (e.pointerType !== 'touch') canvas.style.cursor = pickAt(e.clientX, e.clientY) ? 'pointer' : ''; return; }
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 7) downAt.moved = true;
    if (ptr.size === 2) { ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (lastPinch) zoomK = clamp(zoomK * (lastPinch / d), 0.5, 1.7); lastPinch = d; return; }
    const lim = focus.kind === 'main' ? 1.15 : 0.6;
    dragAz = clamp(dragAz - (e.clientX - p.x) * 0.0085, -lim, lim); dragPol = clamp(dragPol - (e.clientY - p.y) * 0.007, -0.4, 0.4); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  canvas.addEventListener('pointerup', (e) => { if (ptr.size === 1 && downAt && !downAt.moved) { const p = pickAt(e.clientX, e.clientY); if (p) onTap(p); } ptr.delete(e.pointerId); lastPinch = 0; });
  canvas.addEventListener('pointercancel', (e) => { ptr.delete(e.pointerId); lastPinch = 0; });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomK = clamp(zoomK * (1 + e.deltaY * 0.001), 0.5, 1.7); }, { passive: false });

  /* ---------- sim events ---------- */
  const sparks = [];
  function burstSparks() {
    for (let k = 0; k < 14; k++) { const s = glow(scene, 0xffd27a, 0.35, tankWorld.x, tankWorld.y + 0.7, tankWorld.z, 1); s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.2 + 0.5, (Math.random() - 0.5) * 3); s.userData.life = 0.9; sparks.push(s); }
  }
  sim.on('power', () => { burstSparks(); });
  sim.on('pod', (i) => { addPodMesh(i, !reduced); setGoal(); });
  sim.on('start', (i) => { const e = bayEntry[i]; if (e && e.person) { const from = e.person.position.clone().add(new THREE.Vector3(0.1, 1.1, -0.2)), to = socketWorld(i); const L = makeLane(new THREE.QuadraticBezierCurve3(from, from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 1.4, 0)), to), 0x5aa9ff, 5, 0.2, 0.8, { temp: true }); L.t = 1.6; } });

  /* ---------- bubbles and tags (DOM) ---------- */
  const bubbleEls = new Map(), tags = [];
  const svg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    tap: svg('<path d="M9 11V5a2 2 0 0 1 4 0v6"/><path d="M13 10.5a2 2 0 0 1 4 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.6 1.6 0 0 1 2.6-1.8L9 14"/>'),
    phone: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    power: svg('<path d="M12 3v9"/><path d="M6.3 6.5a8 8 0 1 0 11.4 0"/>'),
    play: svg('<path d="M7 4.5v15l12-7.5z"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
  };
  function bubbleEl(key) {
    let el = bubbleEls.get(key);
    if (!el) { el = document.createElement('button'); el.className = 'bubble'; el.type = 'button'; labelsEl.appendChild(el); bubbleEls.set(key, el); }
    return el;
  }
  /* Bubbles for vehicles and drivers sit on the empty pavement below them, so they never cover the plug points on the wall. */
  function targetPos(b, out) {
    if (b.kind === 'queue') { const e = queueEntry(b.id); if (!e) return null; out.copy(e.group.position).add(new THREE.Vector3(0, 2.4, 0)); return 'above'; }
    if (b.kind === 'driver') { const e = bayEntry[b.i]; if (!e || !e.person) return null; out.copy(e.person.position).add(new THREE.Vector3(0.2, 0.05, 1.0)); return 'below'; }
    if (b.kind === 'vehicle') { const e = bayEntry[b.i]; if (!e) return null; out.copy(e.group.position).add(new THREE.Vector3(-0.2, 0.05, 2.0)); return 'below'; }
    if (b.kind === 'transformer') { out.copy(tankWorld).add(new THREE.Vector3(0, 1.45, 0)); return 'above'; }
    if (b.kind === 'box') { out.set(0, M.HUB_Y + 0.5, WALLZ + 0.2); return 'above'; }
    return null;
  }
  const pickOf = (b) => (b.kind === 'queue' ? { type: 'queue', id: b.id } : b.kind === 'driver' ? { type: 'driver', i: b.i } : b.kind === 'vehicle' ? { type: 'vehicle', i: b.i } : { type: b.kind });
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmpc = new THREE.Color();
  function drawBubbles(list) {
    const seen = new Set(); let hintTarget = null;
    list.forEach((b) => {
      const side = targetPos(b, tmp); if (!side) return;
      const key = b.kind + (b.id != null ? b.id : b.i != null ? b.i : ''); seen.add(key);
      const el = bubbleEl(key); const html = `<i>${ICON[b.icon] || ''}</i><span>${b.text}</span>`;
      if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; el.onclick = () => onTap(pickOf(b)); }
      el.classList.toggle('tut', !!b.tutorial); el.classList.toggle('info', !!b.info); el.classList.toggle('below', side === 'below');
      if (b.progress != null) el.style.setProperty('--p', (clamp(b.progress, 0, 1) * 360).toFixed(0) + 'deg'); el.classList.toggle('timer', b.progress != null); el.classList.toggle('late', b.progress != null && b.progress < 0.3);
      tmp2.copy(tmp).project(camera);
      if (tmp2.z > 1) { el.style.display = 'none'; return; }
      el.style.display = 'flex';
      const sx = clamp((tmp2.x * 0.5 + 0.5) * vw, 56, vw - 56), sy = clamp((-tmp2.y * 0.5 + 0.5) * vh, ins.top + 48, vh - ins.bottom - 24);
      el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,${side === 'below' ? '10px' : '-100%'})`;
      if (b.tutorial && !hintTarget) hintTarget = tmp.clone();
    });
    bubbleEls.forEach((el, key) => { if (!seen.has(key)) { el.remove(); bubbleEls.delete(key); } });
    return hintTarget;
  }
  function drawTags() {
    while (tags.length < pods.length) { const i = tags.length, el = document.createElement('button'); el.type = 'button'; el.className = 'podtag'; el.onclick = () => onTap({ type: 'pod', i }); el.setAttribute('aria-label', 'Plug point ' + (i + 1)); labelsEl.appendChild(el); tags.push(el); }
    const live = game.state.phase === 'tutorial' || game.state.phase === 'play';
    tags.forEach((el, i) => {
      if (!pods[i] || focus.kind !== 'main' || !live || !S.sockets[i].vehicle || S.sockets[i].status === 'arriving') { el.style.display = 'none'; return; }
      const s = S.sockets[i], cls = !S.power ? 'off' : s.status === 'charging' ? 'run' : s.status === 'stopped' ? 'wait' : s.status === 'done' ? 'done' : 'free';
      const prog = s.vehicle ? (s.status === 'done' ? 1 : s.vehicle.soc) : 0, html = s.vehicle && s.status !== 'arriving' ? `<b>${Math.round(prog * 100)}%</b><small>Plug ${i + 1}</small>` : `<b>${i + 1}</b><small>Plug</small>`;
      if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
      if (el.dataset.c !== cls) { el.className = 'podtag ' + cls; el.dataset.c = cls; }
      el.style.setProperty('--p', (prog * 360).toFixed(0) + 'deg');
      tmp.set(pods[i].x, M.POD_Y + 0.3, WALLZ + 0.1).project(camera);
      if (tmp.z > 1) { el.style.display = 'none'; return; }
      el.style.display = 'flex'; el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * vw).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * vh).toFixed(1)}px) translate(-50%,-100%)`;
    });
  }
  /* pulsing rings on everything you can tap */
  stall.updateMatrixWorld(true); const routerWorld = new THREE.Vector3(); stall.userData.router.getWorldPosition(routerWorld); routerWorld.y += 0.28;
  const hotDefs = [
    { key: 'box', kind: 'box', pick: { type: 'box' }, title: 'Open the Box', pos: () => tmp3.set(0, M.HUB_Y + 0.3, WALLZ + 0.15) },
    { key: 'tr', kind: 'transformer', pick: { type: 'transformer' }, title: 'Transformer', pos: () => tmp3.copy(tankWorld).add(new THREE.Vector3(0, 1.25, 0)) },
    { key: 'host', kind: null, pick: { type: 'host' }, title: 'The Host', pos: () => tmp3.copy(host.position).add(new THREE.Vector3(0, 2.0, 0)) },
    { key: 'router', kind: null, pick: { type: 'router' }, title: 'Wi-Fi router', pos: () => tmp3.copy(routerWorld) },
  ];
  const hotEls = new Map(), tmp3 = new THREE.Vector3();
  function hotEl(key, title, pick, sm) {
    let el = hotEls.get(key); if (!el) { el = document.createElement('button'); el.type = 'button'; el.className = 'hot' + (sm ? ' sm' : ''); el.setAttribute('aria-label', title); el.onclick = () => onTap(pick); labelsEl.appendChild(el); hotEls.set(key, el); } return el;
  }
  function drawHot(bubs) {
    const live = (game.state.phase === 'tutorial' || game.state.phase === 'play') && focus.kind === 'main', used = new Set();
    const place2 = (el, p) => { tmp2.copy(p).project(camera); if (tmp2.z > 1) { el.style.display = 'none'; return; } el.style.display = 'block'; el.style.transform = `translate(${((tmp2.x * 0.5 + 0.5) * vw).toFixed(1)}px,${(clamp((-tmp2.y * 0.5 + 0.5) * vh, ins.top + 24, vh - ins.bottom - 16)).toFixed(1)}px) translate(-50%,-50%)`; };
    if (live) {
      hotDefs.forEach((d) => { if (d.kind && bubs.some((b) => b.kind === d.kind)) return; used.add(d.key); place2(hotEl(d.key, d.title, d.pick, false), d.pos()); });
    }
    if (live) S.sockets.forEach((sk, i) => {
      const e = bayEntry[i]; if (!e || e.mode !== 'parked' || !sk.vehicle || sk.status === 'arriving') return;
      const key = 'veh' + i; used.add(key); const el = hotEl(key, 'Show the live numbers', { type: 'vehicle', i }, false);
      place2(el, tmp3.copy(e.group.position).add(new THREE.Vector3(-0.1, 0.8, 0.6)));
    });
    hotEls.forEach((el, k) => { if (!used.has(k)) el.style.display = 'none'; });
  }
  /* numbered pins on the parts when a unit is open */
  let pinEls = [], pinData = null;
  function buildPins(kind, i) {
    pinEls.forEach((e) => e.remove()); pinEls = []; pinData = null;
    const data = kind === 'hub' ? hub.userData.pins : kind === 'pod' && pods[i] ? pods[i].group.userData.pins : null; if (!data) return;
    pinData = { data, grp: kind === 'hub' ? hub : pods[i].group };
    data.forEach((p, k) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'pin'; el.textContent = String(k + 1); el.setAttribute('aria-label', p.label); el.onclick = () => { pinEls.forEach((x, n) => x.classList.toggle('on', n === k)); onPin && onPin(k, p); }; labelsEl.appendChild(el); pinEls.push(el); });
  }
  function drawPins() {
    const open = focus.kind === 'hub' ? hub.userData.open || 0 : focus.kind === 'pod' && pods[focus.i] ? pods[focus.i].open : 0;
    pinEls.forEach((el, k) => {
      if (!pinData || open < 0.92) { el.style.display = 'none'; return; }
      tmp.copy(pinData.data[k].pos); pinData.grp.localToWorld(tmp); tmp.project(camera);
      if (tmp.z > 1) { el.style.display = 'none'; return; }
      el.style.display = 'grid'; el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * vw).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * vh).toFixed(1)}px) translate(-50%,-50%)`;
    });
  }

  /* ---------- frame ---------- */
  let time = 0, exposure = 1.0, last = performance.now(), visible = true, fpsAcc = 0, fpsN = 0, lowT = 0;
  const steam = []; for (let k = 0; k < 5; k++) steam.push(glow(world, 0xffffff, 0.3, 0, 0, 0, 0));
  stall.updateMatrixWorld(true); const steamBase = stall.localToWorld(stall.userData.steamAt.clone());
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  function updateEntries(dt) {
    for (let k = entries.length - 1; k >= 0; k--) {
      const e = entries[k], g = e.group;
      if (e.mode === 'enter' || e.mode === 'queue') {
        const idx = game.state.queue.findIndex((x) => x.id === e.qid); const tx = QX[Math.max(0, idx) % QX.length];
        const dx = tx - g.position.x, step = dx * Math.min(1, dt * 2.2); g.position.x += step; spinWheels(e, Math.abs(step));
        const ty = Math.abs(dx) > 0.06 ? -Math.sign(dx) * Math.min(1, Math.abs(dx) / 2.5) * (Math.PI / 2) : 0; g.rotation.y += (ty - g.rotation.y) * Math.min(1, dt * 5);
        if (Math.abs(dx) < 0.05 && Math.abs(g.rotation.y) < 0.03) e.mode = 'queue';
      } else if (e.mode === 'park') {
        e.p = Math.min(1, e.p + dt / 2.4); const t = ease(e.p), dx = e.to.x - e.from.x, dz = e.to.z - e.from.z;
        const prevX = g.position.x, prevZ = g.position.z; g.position.x = e.from.x + dx * t; g.position.z = e.from.z + dz * t; spinWheels(e, Math.hypot(g.position.x - prevX, g.position.z - prevZ));
        const head = Math.atan2(-dx, -dz), f = e.p < 0.18 ? e.p / 0.18 : e.p > 0.82 ? (1 - e.p) / 0.18 : 1; g.rotation.y += (head * f - g.rotation.y) * Math.min(1, dt * 8);
        if (e.p >= 1) { g.rotation.y = 0; g.position.set(e.to.x, 0, e.to.z); e.mode = 'parked'; buildCable(e); standDriver(e, e.bay); }
      } else if (e.mode === 'leave') {
        e.p += dt / 3.6; const side = (e.upset ? (e.qid ? 1 : (g.position.x >= 0 ? 1 : -1)) : (e.bay >= 0 && slotX(e.bay) < 0 ? -1 : 1));
        if (e.p < 0.4 && !e.upset) { const t = e.p / 0.4; g.position.z = CARZ + (2.6 - CARZ) * ease(t); spinWheels(e, -0.02); }
        else { const t = clamp((e.p - 0.4) / 0.6, 0, 1); g.position.x += side * 6.5 * dt * (0.4 + t * 1.6); g.position.z += (QUEUE_Z - 0.6 - g.position.z) * Math.min(1, dt * 1.2); spinWheels(e, 6.5 * dt * 0.02 * 4); g.rotation.y += (-side * (Math.PI / 2) - g.rotation.y) * Math.min(1, dt * 4); }
        if (Math.abs(g.position.x) > 21 || e.p > 1.5) removeEntry(e);
      }
      if (e.person) { const sc = e.person.scale.x; if (sc < 1) e.person.scale.setScalar(Math.min(1, sc + dt * 3)); }
      if (e.mode === 'parked') {
        const s = S.sockets[e.bay];
        if (!s || !s.vehicle || s.vid !== e.vid) { e.mode = 'leave'; e.p = 0; e.upset = false; if (e.cable) { dispose(e.cable); e.cable = null; } if (e.plug) { dispose(e.plug); e.plug = null; } e.motes.forEach((m) => (m.material.opacity = 0)); if (e.person) { dispose(e.person); e.person = null; } g.userData.seated.visible = true; e.group.userData.pick = null; bayEntry[e.bay] = null; continue; }
        g.userData.setGauge(s.vehicle.soc, s.status === 'charging' || s.status === 'done' || s.status === 'stopped');
        e.motes.forEach((m, n) => { const show = s.status === 'charging' && S.power; m.material.opacity = show ? 0.9 : 0; if (show) { try { m.position.copy(e.curve.getPoint((time * 0.55 + n * 0.5) % 1)); } catch (err) { m.material.opacity = 0; } } });
        if (e.person) { const pg = e.person.userData.phoneGlow; if (pg) pg.material.opacity = 0.4 + 0.25 * Math.sin(time * 3 + e.bay) + (s.status === 'parked' ? 0.35 : 0); }
      }
    }
    // a vehicle exists in the sim but not in the world (for example spawned by something else)
    S.sockets.forEach((s, i) => { if (s.vehicle && !bayEntry[i]) adoptStray(i); });
  }

  function frame(dt) {
    time += dt;
    updateEntries(dt);
    // pods: drop-in animation, LEDs, cover
    pods.forEach((p, i) => {
      if (p.drop < 1) { p.drop = Math.min(1, p.drop + dt / 0.6); p.group.scale.setScalar(Math.max(0.01, ease(p.drop))); p.group.position.y = M.POD_Y + (1 - ease(p.drop)) * 0.5; }
      const s = S.sockets[i]; let led = 'green', k = 1;
      if (S.tripped) { led = 'red'; k = Math.sin(time * 8) > 0 ? 1 : 0.2; } else if (s.status === 'charging') { led = 'blue'; k = 0.65 + 0.35 * Math.sin(time * 4); } else if (s.status === 'stopped') { led = 'amber'; k = Math.sin(time * 7) > 0 ? 1 : 0.15; }
      const u = p.group.userData, on = S.power; tmpc.set(LEDC[led]);
      u.led.emissive.copy(tmpc); u.led.emissiveIntensity = on ? 2.2 * k : 0; u.led.color.set(on ? tmpc : 0x2a323b); u.lglow.material.color.copy(tmpc); u.lglow.material.opacity = on ? 0.85 * k : 0;
      const want = focus.kind === 'pod' && focus.i === i ? 1 : 0; p.open += (want - p.open) * Math.min(1, dt * 4); u.plate.material.opacity = 1 - 0.88 * p.open; u.inner.visible = p.open > 0.05;
    });
    // hub
    const hu = hub.userData, wantHub = focus.kind === 'hub' ? 1 : 0; hu.open = (hu.open || 0) + (wantHub - (hu.open || 0)) * Math.min(1, dt * 3.2);
    hu.hinge.rotation.y = -1.9 * hu.open; hu.inner.visible = hu.open > 0.05;
    const bubs = game.bubbles();
    beacon.material.opacity = focus.kind === 'main' && bubs.some((b) => b.kind === 'box') ? 0.45 + 0.25 * Math.sin(time * 3.5) : 0;
    unit.userData.glowRing.material.opacity = focus.kind === 'main' && bubs.some((b) => b.kind === 'transformer') ? 0.55 + 0.35 * Math.sin(time * 4) : 0;
    // router LED, host phone
    stall.userData.rled.emissiveIntensity = S.wifi ? 1.6 : 0; stall.userData.rled.color.set(S.wifi ? 0x2fd37a : 0x552222); stall.userData.rled.emissive.set(S.wifi ? 0x2fd37a : 0x000000);
    host.userData.phoneGlow.material.opacity = 0.45 + 0.2 * Math.sin(time * 3);
    // steam and coals
    steam.forEach((s, n) => { const t = ((time * 0.35 + n / steam.length) % 1); s.position.set(steamBase.x + Math.sin(t * 6 + n) * 0.06, steamBase.y + t * 0.9, steamBase.z); s.scale.setScalar(0.2 + t * 0.5); s.material.opacity = S.power || true ? 0.28 * (1 - t) : 0; });
    stall.userData.coal.material.opacity = 0.45 + 0.15 * Math.sin(time * 5);
    // sparks
    for (let k = sparks.length - 1; k >= 0; k--) { const s = sparks[k]; s.userData.life -= dt; s.userData.v.y -= 6 * dt; s.position.addScaledVector(s.userData.v, dt); s.material.opacity = Math.max(0, s.userData.life); if (s.userData.life <= 0) { scene.remove(s); sparks.splice(k, 1); } }
    // electricity (amber) and data (blue)
    gridLane.target = S.power ? 0.35 + Math.min(0.65, S.totalW / 1200) : 0;
    pods.forEach((p, i) => { const st = S.sockets[i].status; p.eLane.target = S.power ? (st === 'charging' ? 1 : 0.12) : 0; p.dLane.target = S.power ? 0.6 : 0; });
    wifiLane.target = S.wifi && S.power && (S.ledger.some((e) => !e.synced) || Math.sin(time * 0.8) > 0.3) ? 1 : 0;
    if (syncFlash > 0) { syncFlash -= dt; bleLane.target = 1; upLane.target = 1; } else { bleLane.target = 0; upLane.target = 0; }
    updateLanes(dt, time);
    const hu0 = hub.userData.leds, bl = (f) => (Math.sin(time * f) > 0 ? 1 : 0.15);
    hu0.PWR.emissiveIntensity = S.power ? 1.8 : 0; hu0['WI-FI'].emissiveIntensity = S.power && S.wifi ? (S.ledger.some((e) => !e.synced) ? 1.8 * bl(10) : 1.2) : 0;
    hu0.BLE.emissiveIntensity = S.power ? (syncFlash > 0 ? 1.8 * bl(12) : 0.45) : 0; hu0.FAULT.emissiveIntensity = S.tripped ? 1.8 * bl(8) : 0;
    crows.forEach((c) => { const a = time * 0.18 + c.userData.k * 1.7; c.position.set(2 + Math.cos(a) * (8 + c.userData.k), 8.5 + Math.sin(a * 2) * 0.6 + c.userData.k * 0.5, -6 + Math.sin(a) * 4); c.rotation.y = -a; const fl = Math.sin(time * 9 + c.userData.k) * 0.5; c.userData.l.rotation.z = fl; c.userData.r.rotation.z = -fl; });
    // lighting
    const k = Math.min(1, dt * 4), amb = S.power ? 1 : 0.3, lamp = S.power ? 1 : 0;
    hemi.intensity += ((S.power ? 0.9 : 0.28) - hemi.intensity) * k; sun.intensity += ((S.power ? 2.4 : 0.9) - sun.intensity) * k; exposure += ((S.power ? 1.0 : 0.66) - exposure) * k; renderer.toneMappingExposure = exposure;
    lampLights.forEach((l) => { l.pl.intensity += (lamp * l.base - l.pl.intensity) * Math.min(1, dt * 8); const r = l.pl.intensity / l.base; l.g.material.opacity = 0.9 * r; l.bulb.material.emissiveIntensity = 1.6 * r; });
    // camera (with a pan toward off-screen tutorial targets)
    const hint = hintTarget; let pan = 0;
    if (hint && focus.kind === 'main') { tmp.copy(hint).project(camera); if (Math.abs(tmp.x) > 0.8) pan = clamp(hint.x * 0.6, -4.2, 4.2); }
    hintPan += (pan - hintPan) * Math.min(1, dt * 2);
    ['az', 'pol', 'r', 'tx', 'ty', 'tz'].forEach((key) => {
      const g = key === 'az' ? goal.az + dragAz : key === 'pol' ? goal.pol + dragPol : key === 'r' ? goal.r * zoomK : key === 'tx' ? goal.tx + hintPan : goal[key];
      cam[key] += (g - cam[key]) * Math.min(1, dt * 4.2);
    });
    camera.position.set(cam.tx + cam.r * Math.sin(cam.pol) * Math.sin(cam.az), cam.ty + cam.r * Math.cos(cam.pol), cam.tz + cam.r * Math.sin(cam.pol) * Math.cos(cam.az));
    if (!reduced && focus.kind === 'main' && ptr.size === 0) camera.position.x += Math.sin(time * 0.22) * 0.12;
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    renderer.render(scene, camera);
    hintTarget = drawBubbles(bubs); drawTags(); drawHot(bubs); drawPins();
    // quality guard: drop detail on slow devices
    fpsAcc += dt; fpsN++; if (fpsAcc > 2) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 24 && q === 'high') { lowT++; if (lowT >= 2) setQuality('low'); } else lowT = 0; }
  }
  let hintTarget = null;
  function setQuality(level) {
    if (level === q) return; q = level; renderer.shadowMap.enabled = q === 'high'; sun.castShadow = q === 'high'; renderer.setPixelRatio(q === 'high' ? Math.min(devicePixelRatio || 1, 2) : 1); renderer.setSize(vw, vh, false);
    scene.traverse((o) => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; }); onQuality && onQuality(q);
  }
  function loop(now) { requestAnimationFrame(loop); if (!visible) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); }
  resize(); requestAnimationFrame(loop);

  return {
    focus(kind, i = 0) { focus = { kind, i }; buildPins(kind, i); setGoal(); },
    pins: () => (pinData ? pinData.data : []),
    selectPin(k) {
      if (!pinData || !pinData.data[k]) return; pinEls.forEach((x, n) => x.classList.toggle('on', n === k)); onPin && onPin(k, pinData.data[k]);
      pinData.grp.updateMatrixWorld(true); const w = pinData.grp.localToWorld(pinData.data[k].pos.clone());
      Object.assign(goal, { tx: w.x, ty: w.y, tz: w.z, r: fit(0.07, 0.05, 0.08), az: 0.1, pol: 1.5 }); dragAz = 0; dragPol = 0; zoomK = 1;
    },
    clearPin() { pinEls.forEach((x) => x.classList.remove('on')); setGoal(); },
    getFocus: () => focus,
    setInsets(v) { Object.assign(ins, v); resize(); },
    flashSync() { syncFlash = 3.2; },
    setQuality,
    quality: () => q,
    screenOf(i) { const e = bayEntry[i]; if (!e) return null; tmp.copy(e.group.position).add(new THREE.Vector3(0, 1.6, 0)).project(camera); return { x: (tmp.x * 0.5 + 0.5) * vw, y: (-tmp.y * 0.5 + 0.5) * vh }; },
  };
}
