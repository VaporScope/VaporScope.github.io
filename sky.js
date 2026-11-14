// Sunset sky and a sea of clouds drifting under the aircraft.
import * as THREE from 'three';

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const HORIZON = 0xf0a07c;

export function buildSky(scene) {
  const world = new THREE.Group();
  scene.add(world);
  const sunDir = new THREE.Vector3(-0.32, 0.06, -1).normalize();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { sunDir: { value: sunDir } },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 sunDir;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 zenith = vec3(0.035, 0.07, 0.19);
          vec3 mid = vec3(0.19, 0.27, 0.52);
          vec3 horizon = vec3(0.94, 0.63, 0.49);
          vec3 low = vec3(0.70, 0.48, 0.47);
          vec3 col;
          if (h > 0.0) {
            col = mix(horizon, mid, smoothstep(0.0, 0.16, h));
            col = mix(col, zenith, smoothstep(0.16, 0.75, h));
          } else {
            col = mix(horizon, low, 1.0 - smoothstep(-0.25, 0.0, h));
          }
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += vec3(1.0, 0.62, 0.32) * pow(s, 6.0) * 0.45;
          col += vec3(1.0, 0.55, 0.25) * pow(s, 2.0) * 0.18 * (1.0 - smoothstep(0.0, 0.35, abs(h)));
          col += vec3(1.0, 0.92, 0.75) * smoothstep(0.9993, 0.9997, s) * 1.4;
          col += vec3(1.0, 0.8, 0.55) * pow(s, 300.0) * 0.6;
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  world.add(dome);

  // A flat deck under the puffs so gaps never show empty sky.
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({ color: 0xe9c2b8 }));
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = -13;
  world.add(deck);

  // Cloud puffs, grouped in clusters that drift toward the camera.
  const rand = rng(7);
  const clusters = [];
  const FIELD_X = 260;
  const NEAR = 40;
  const FAR = -760;
  let count = 0;
  while (count < 1300) {
    const n = 4 + Math.floor(rand() * 6);
    const base = 3 + rand() * 6;
    const puffs = [];
    for (let k = 0; k < n; k++) {
      puffs.push({ dx: (rand() * 2 - 1) * base * 1.7, dy: rand() * base * 0.4, dz: (rand() * 2 - 1) * base, s: base * (0.55 + rand() * 0.6), sy: 0.5 + rand() * 0.25 });
    }
    clusters.push({ x: (rand() * 2 - 1) * FIELD_X, y: -11 + rand() * 3, z: FAR + rand() * (NEAR - FAR), puffs });
    count += n;
  }
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshLambertMaterial({ color: 0xfff3ee }), count);
  mesh.frustumCulled = false;
  world.add(mesh);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  function write() {
    let i = 0;
    for (const c of clusters) {
      for (const f of c.puffs) {
        p.set(c.x + f.dx, c.y + f.dy, c.z + f.dz);
        sc.set(f.s, f.s * f.sy, f.s);
        m4.compose(p, q, sc);
        mesh.setMatrixAt(i++, m4);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  write();

  const SPEED = 34;
  return {
    world,
    sunDir,
    roll: 0,
    pitch: 0,
    update(t, dt) {
      for (const c of clusters) {
        c.z += SPEED * dt;
        if (c.z > NEAR) {
          c.z -= NEAR - FAR;
          c.x = (rand() * 2 - 1) * FIELD_X;
        }
      }
      write();
      this.roll = Math.sin(t * 0.13) * 0.03 + Math.sin(t * 0.37) * 0.008;
      this.pitch = Math.sin(t * 0.21) * 0.01;
      world.rotation.z = this.roll;
      world.position.y = -this.pitch * 40;
    },
  };
}
