// The cockpit: a detailed 737-800 model, with live images on its displays.
// Model: "Boeing 737-800 Cockpit" by hakai315 on Sketchfab, licensed CC BY 4.0.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makePFD, makeND, makeEICAS, makeDesktopPreview } from './screens.js';

// The model is about half real size, so it is scaled up.
const S = 2;
// Positions measured on the model, in its own units. Its nose points toward +Z.
// Display openings were measured by scanning the panel with rays.
const PANEL_Z = 1.4584;
const DU = 0.1;
const DU_Y = 1.878;
const PANEL = { n: [0, 0, -1], u: [0, 1, 0] };
const LOWER = { n: [0, 0.901, -0.433], u: [0, 0.433, 0.901] };
const DISPLAYS = [
  { key: 'pfdL', p: [0.324, DU_Y, PANEL_Z], size: DU, face: PANEL },
  { key: 'ndL', p: [0.198, DU_Y, PANEL_Z], size: DU, face: PANEL },
  { key: 'os', p: [0.007, DU_Y, PANEL_Z], size: DU, face: PANEL },
  { key: 'ndR', p: [-0.155, DU_Y, PANEL_Z], size: DU, face: PANEL },
  { key: 'pfdR', p: [-0.28, DU_Y, PANEL_Z], size: DU, face: PANEL },
  { key: 'stby', p: [0.103, 1.905, 1.4563], size: 0.037, face: PANEL },
  { key: 'eicas', p: [0.009, 1.7915, 1.407], size: 0.098, face: LOWER },
];
const POSES = {
  intro: { pos: [0, 2.22, 0.5], target: [0, 1.93, 1.46] },
  home: { pos: [0, 2.12, 0.62], target: [0, 1.86, 1.46] },
};

export async function buildCockpit(scene, onProgress) {
  const root = new THREE.Group();
  root.rotation.y = Math.PI; // face the nose toward -Z like the rest of the scene
  scene.add(root);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('cockpit.glb', (e) => {
    if (onProgress && e.total) onProgress(e.loaded / e.total);
  });
  const model = gltf.scene;
  model.scale.setScalar(S);
  root.add(model);

  // One stray part of the model sits about 60 m to the side; clip it away.
  const clip = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 8), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 8)];
  // The model's seats are white; tint everything inside the two seat areas a charcoal fabric color.
  root.updateMatrixWorld(true);
  const toModel = { value: new THREE.Matrix4().makeScale(1 / S, 1 / S, 1 / S).multiply(root.matrixWorld.clone().invert()) };
  const seatTint = (shader) => {
    shader.uniforms.uToModel = toModel;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uToModel;\nvarying vec3 vModelPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvModelPos = (uToModel * modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vModelPos;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float ax = abs(vModelPos.x);
        // Seat areas: beside the control stand, or just above its height closer in.
        float side = max(step(0.22, ax), step(0.15, ax) * step(1.8, vModelPos.y));
        float seat = side * step(ax, 0.8) * step(1.1, vModelPos.y) * step(vModelPos.y, 2.75) * step(0.15, vModelPos.z) * step(vModelPos.z, 1.12);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.2, 0.2, 0.21), seat);`
      );
  };
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.material.name === 'Material.261') o.material.clippingPlanes = clip;
    o.material.envMapIntensity = 0.6;
    o.material.onBeforeCompile = seatTint;
    o.material.customProgramCacheKey = () => 'seat-tint';
  });

  const tex = {
    pfdL: makePFD(),
    ndL: makeND(),
    os: makeDesktopPreview(800, 800),
    ndR: makeND({ vsd: true }),
    pfdR: makePFD(),
    eicas: makeEICAS(),
  };
  tex.stby = tex.pfdL;

  const v3 = (a) => new THREE.Vector3(...a);
  const faceQuat = (face) => {
    const n = v3(face.n);
    const u = v3(face.u);
    const r = new THREE.Vector3().crossVectors(u, n);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, n));
  };

  let centerScreen;
  let glow;
  for (const d of DISPLAYS) {
    const n = v3(d.face.n);
    const q = faceQuat(d.face);
    const size = d.size * S;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex[d.key].tex, toneMapped: false }));
    scr.position.copy(v3(d.p).addScaledVector(n, 0.0012).multiplyScalar(S));
    scr.quaternion.copy(q);
    root.add(scr);
    if (d.key === 'os') {
      centerScreen = scr;
      glow = new THREE.Mesh(
        new THREE.PlaneGeometry(size * 1.12, size * 1.12),
        new THREE.MeshBasicMaterial({ color: 0x62e3f0, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })
      );
      glow.position.copy(v3(d.p).addScaledVector(n, 0.0008).multiplyScalar(S));
      glow.quaternion.copy(q);
      root.add(glow);
    }
  }

  root.updateMatrixWorld(true);
  const world = (a) => root.localToWorld(v3(a).multiplyScalar(S));
  const poses = {};
  for (const [k, p] of Object.entries(POSES)) poses[k] = { pos: world(p.pos), target: world(p.target) };

  let glowTarget = 0;
  let acc = 0;
  let accPreview = 0;
  return {
    root,
    centerScreen,
    screenSize: { w: DU * S, h: DU * S },
    poses,
    center: world([0, 1.9, 1.0]),
    panelLight: world([0, 2.08, 1.12]),
    setHover(on) {
      glowTarget = on ? 0.85 : 0;
    },
    update(t, dt, s) {
      acc += dt;
      if (acc > 1 / 20) {
        acc = 0;
        tex.pfdL.draw(t, s.roll, s.pitch);
        tex.pfdR.draw(t + 0.4, s.roll, s.pitch);
        tex.ndL.draw(t, 270 + s.roll * 25);
        tex.ndR.draw(t, 270 + s.roll * 25);
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
