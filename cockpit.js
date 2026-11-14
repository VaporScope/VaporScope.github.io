// The cockpit, built entirely from simple shapes. Units are meters; the pilot looks toward -Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makePFD, makeND, makeEICAS, makeFCU, makeMCDU, makeDesktopPreview } from './screens.js';

export const SCREEN = { w: 0.5, h: 0.32 };

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BTN = { off: 0x23272e, white: 0xf3ead6, green: 0x41e58a, amber: 0xffb547, cyan: 0x5ce1e6 };

export function buildCockpit(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const rand = rng(42);

  const M = {
    shell: new THREE.MeshStandardMaterial({ color: 0x353b45, roughness: 0.85, metalness: 0.05 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x20252c, roughness: 0.75, metalness: 0.1 }),
    glare: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.95 }),
    bezel: new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.45, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x7a838f, roughness: 0.35, metalness: 0.75 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.7, metalness: 0.15 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x1b1e23, roughness: 1 }),
    glass: new THREE.MeshBasicMaterial({ color: 0xbcd6ff, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false }),
  };

  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const rbox = (w, h, d, r = 0.012) => new RoundedBoxGeometry(w, h, d, 3, r);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const UP = new THREE.Vector3(0, 1, 0);
  const beam = (a, b, t, mat, parent = root) => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const m = new THREE.Mesh(box(t, A.distanceTo(B), t), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
    parent.add(m);
    return m;
  };
  const pick = () => {
    const r = rand();
    return r < 0.6 ? 'off' : r < 0.8 ? 'white' : r < 0.9 ? 'green' : r < 0.97 ? 'amber' : 'cyan';
  };
  const buttonField = (parent, list, size) => {
    const mesh = new THREE.InstancedMesh(box(...size), new THREE.MeshBasicMaterial({ toneMapped: false }), list.length);
    const m4 = new THREE.Matrix4();
    const c = new THREE.Color();
    list.forEach((b, i) => {
      m4.makeTranslation(b.x, b.y, b.z);
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, c.setHex(BTN[b.c]));
    });
    parent.add(mesh);
    return mesh;
  };
  const screenMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });

  const tex = {
    pfdL: makePFD(),
    nd: makeND(),
    os: makeDesktopPreview(),
    eicas: makeEICAS(),
    pfdR: makePFD(),
    fcu: makeFCU(),
    mcduL: makeMCDU('L'),
    mcduR: makeMCDU('R'),
  };

  // ---------- Main instrument panel ----------
  const panel = new THREE.Group();
  panel.position.set(0, 0.98, -0.9);
  panel.rotation.x = -0.26;
  root.add(panel);
  add(panel, rbox(2.24, 0.56, 0.06, 0.015), M.panel, 0, 0, 0);
  const defs = [
    ['pfdL', -0.84, 0.3, 0.3],
    ['nd', -0.46, 0.3, 0.3],
    ['os', 0, SCREEN.w, SCREEN.h],
    ['eicas', 0.46, 0.3, 0.3],
    ['pfdR', 0.84, 0.3, 0.3],
  ];
  const SY = 0.03;
  let centerScreen;
  let glow;
  for (const [key, x, w, h] of defs) {
    add(panel, rbox(w + 0.036, h + 0.036, 0.016, 0.006), M.bezel, x, SY, 0.036);
    const scr = add(panel, new THREE.PlaneGeometry(w, h), screenMat(tex[key].tex), x, SY, 0.0446);
    if (key === 'os') {
      centerScreen = scr;
      glow = add(
        panel,
        new THREE.PlaneGeometry(w + 0.026, h + 0.026),
        new THREE.MeshBasicMaterial({ color: 0x62e3f0, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }),
        x,
        SY,
        0.0443
      );
    }
  }
  const pb = [];
  for (const [, x, w] of defs) {
    const n = w > 0.4 ? 8 : 5;
    for (let i = 0; i < n; i++) pb.push({ x: x - w / 2 + 0.03 + (i * (w - 0.06)) / (n - 1), y: -0.215, z: 0.034, c: pick() });
  }
  for (let i = 0; i < 24; i++) pb.push({ x: -1.0 + (i * 2.0) / 23, y: 0.245, z: 0.034, c: rand() < 0.7 ? 'off' : rand() < 0.5 ? 'green' : 'white' });
  buttonField(panel, pb, [0.026, 0.016, 0.01]);

  // Knee panel under the main panel
  add(root, box(2.2, 0.74, 0.08), M.shell, 0, 0.37, -0.9);

  // ---------- Glareshield and autopilot panel ----------
  add(root, rbox(2.36, 0.1, 0.4, 0.03), M.glare, 0, 1.29, -1.0);
  add(root, new THREE.PlaneGeometry(0.9, 0.064), screenMat(tex.fcu.tex), 0, 1.29, -0.7985);
  for (const s of [-1, 1]) {
    add(root, box(0.36, 0.07, 0.012), M.bezel, s * 0.74, 1.29, -0.797);
    for (let i = 0; i < 3; i++) {
      const k = add(root, new THREE.CylinderGeometry(0.012, 0.014, 0.022, 16), M.metal, s * 0.74 + (i - 1) * 0.11, 1.29, -0.786);
      k.rotation.x = Math.PI / 2;
    }
  }
  buttonField(
    root,
    [
      { x: -0.52, y: 1.29, z: -0.797, c: 'off' },
      { x: -0.47, y: 1.29, z: -0.797, c: 'off' },
      { x: 0.47, y: 1.29, z: -0.797, c: 'off' },
      { x: 0.52, y: 1.29, z: -0.797, c: 'off' },
    ],
    [0.04, 0.03, 0.006]
  );

  // ---------- Windshield frame, walls and roof ----------
  add(root, box(2.46, 0.06, 0.4), M.shell, 0, 1.33, -1.34);
  beam([0, 1.34, -1.2], [0, 1.99, -0.76], 0.065, M.frame);
  beam([-1.0, 1.99, -0.74], [1.0, 1.99, -0.74], 0.07, M.frame);
  for (const s of [-1, 1]) {
    beam([s * 1.08, 1.33, -1.12], [s * 1.0, 1.99, -0.72], 0.08, M.frame);
    beam([s * 1.2, 1.06, -0.22], [s * 1.13, 1.99, -0.26], 0.07, M.frame);
    beam([s * 1.0, 1.99, -0.72], [s * 1.13, 1.99, -0.26], 0.06, M.frame);
    beam([s * 1.1, 1.06, -1.1], [s * 1.2, 1.06, -0.22], 0.06, M.frame);
    add(root, box(0.06, 1.06, 2.4), M.shell, s * 1.23, 0.53, 0.2);
    add(root, box(0.3, 0.8, 1.5), M.shell, s * 1.05, 0.4, -0.25);
    add(root, box(0.3, 0.03, 1.5), M.panel, s * 1.05, 0.815, -0.25);
    // glass panes, barely visible
    const pane = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.34, -1.2),
      new THREE.Vector3(s * 1.08, 1.33, -1.12),
      new THREE.Vector3(s * 1.0, 1.99, -0.72),
      new THREE.Vector3(0, 1.34, -1.2),
      new THREE.Vector3(s * 1.0, 1.99, -0.72),
      new THREE.Vector3(0, 1.99, -0.76),
    ]);
    root.add(new THREE.Mesh(pane, M.glass));
  }
  add(root, box(2.5, 0.05, 2.1), M.shell, 0, 2.03, 0.3);
  add(root, box(2.4, 0.04, 2.6), M.floor, 0, -0.02, 0);

  // ---------- Overhead panel ----------
  const oh = new THREE.Group();
  oh.position.set(0, 1.96, -0.28);
  oh.rotation.x = 0.18;
  root.add(oh);
  add(oh, rbox(1.1, 0.05, 0.92, 0.012), M.panel, 0, 0, 0);
  const ob = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 16; c++) {
      if (rand() < 0.15) continue;
      ob.push({ x: -0.48 + c * 0.064, y: -0.03, z: -0.4 + r * 0.088, c: pick() });
    }
  }
  buttonField(oh, ob, [0.034, 0.012, 0.026]);

  // ---------- Center pedestal ----------
  add(root, rbox(0.48, 0.82, 1.0, 0.02), M.shell, 0, 0.41, -0.32);
  add(root, box(0.46, 0.02, 0.98), M.panel, 0, 0.825, -0.32);
  for (const [s, key] of [[-1, 'mcduL'], [1, 'mcduR']]) {
    const g = new THREE.Group();
    g.position.set(s * 0.115, 0.86, -0.56);
    g.rotation.x = -1.1;
    root.add(g);
    add(g, rbox(0.2, 0.26, 0.04, 0.01), M.bezel, 0, 0, 0);
    add(g, new THREE.PlaneGeometry(0.16, 0.1), screenMat(tex[key].tex), 0, 0.055, 0.0205);
    const keys = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) keys.push({ x: -0.075 + c * 0.03, y: -0.025 - r * 0.02, z: 0.022, c: 'off' });
    buttonField(g, keys, [0.022, 0.014, 0.006]);
  }
  for (const s of [-1, 1]) {
    beam([s * 0.05, 0.83, -0.34], [s * 0.05, 0.95, -0.4], 0.022, M.metal);
    const h = add(root, new THREE.CylinderGeometry(0.02, 0.02, 0.075, 16), M.grip, s * 0.05, 0.955, -0.405);
    h.rotation.z = Math.PI / 2;
    beam([s * 0.17, 0.83, -0.24], [s * 0.17, 0.9, -0.27], 0.016, M.metal);
    add(root, rbox(0.05, 0.03, 0.04, 0.008), s < 0 ? M.metal : M.grip, s * 0.17, 0.905, -0.275);
    const wheel = add(root, new THREE.CylinderGeometry(0.1, 0.1, 0.025, 32), M.grip, s * 0.245, 0.62, -0.2);
    wheel.rotation.z = Math.PI / 2;
  }
  const pdb = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) pdb.push({ x: -0.17 + c * 0.048, y: 0.84, z: -0.12 + r * 0.05, c: pick() });
  buttonField(root, pdb, [0.026, 0.01, 0.02]);

  // ---------- Control yokes ----------
  for (const s of [-1, 1]) {
    const x = s * 0.55;
    beam([x, 0.05, -0.86], [x, 0.8, -0.64], 0.05, M.metal);
    const yoke = new THREE.Group();
    yoke.position.set(x, 0.82, -0.6);
    yoke.rotation.x = -0.3;
    root.add(yoke);
    const hub = add(yoke, new THREE.CylinderGeometry(0.045, 0.045, 0.06, 20), M.grip, 0, 0, -0.02);
    hub.rotation.x = Math.PI / 2;
    add(yoke, rbox(0.3, 0.035, 0.035, 0.012), M.grip, 0, 0, 0);
    for (const g of [-1, 1]) {
      const grip = add(yoke, rbox(0.042, 0.15, 0.045, 0.015), M.grip, g * 0.15, 0.06, 0);
      grip.rotation.z = g * 0.12;
    }
    add(yoke, rbox(0.11, 0.07, 0.02, 0.01), M.metal, 0, 0, 0.025);
  }

  // ---------- Animation ----------
  let glowTarget = 0;
  let acc = 0;
  let accPreview = 0;
  return {
    root,
    centerScreen,
    setHover(on) {
      glowTarget = on ? 0.85 : 0;
    },
    update(t, dt, s) {
      acc += dt;
      if (acc > 1 / 20) {
        acc = 0;
        tex.pfdL.draw(t, s.roll, s.pitch);
        tex.pfdR.draw(t + 0.4, s.roll, s.pitch);
        tex.nd.draw(t, 270 + s.roll * 25);
        tex.eicas.draw(t);
      }
      accPreview += dt;
      if (s.preview && accPreview > 1 / 12) {
        accPreview = 0;
        tex.os.draw(t);
      }
      const pulse = glowTarget > 0 ? glowTarget * (0.75 + 0.25 * Math.sin(t * 6)) : 0;
      glow.material.opacity += (pulse - glow.material.opacity) * Math.min(1, dt * 10);
    },
  };
}
