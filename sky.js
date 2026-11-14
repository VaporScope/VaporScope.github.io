// Sunset sky and a deck of clouds far below, both drawn by shaders.
import * as THREE from 'three';

const HAZE = new THREE.Color(0.93, 0.66, 0.55);

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const skyFragment = /* glsl */ `
  uniform vec3 sunDir;
  uniform vec3 haze;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 zenith = vec3(0.03, 0.07, 0.19);
    vec3 mid = vec3(0.2, 0.29, 0.55);
    vec3 col = mix(haze, mid, smoothstep(0.0, 0.18, h));
    col = mix(col, zenith, smoothstep(0.18, 0.8, h));
    if (h < 0.0) col = haze;
    float s = max(dot(d, normalize(sunDir)), 0.0);
    col += vec3(1.0, 0.6, 0.3) * pow(s, 6.0) * 0.5;
    col += vec3(1.0, 0.55, 0.25) * pow(s, 2.0) * 0.15 * (1.0 - smoothstep(0.0, 0.35, abs(h)));
    col += vec3(1.0, 0.93, 0.78) * smoothstep(0.9994, 0.9997, s) * 2.0;
    col += vec3(1.0, 0.8, 0.55) * pow(s, 400.0) * 0.8;
    // Colors above are picked in display space; convert to linear so lighting and tone mapping treat them correctly.
    gl_FragColor = vec4(pow(col, vec3(2.2)) * 1.25, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const cloudVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const cloudFragment = /* glsl */ `
  uniform float time;
  uniform vec3 sunDir;
  uniform vec3 haze;
  varying vec3 vWorld;
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }
  float clouds(vec2 p) {
    vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
    return fbm(p + 1.7 * q);
  }
  void main() {
    vec2 p = vWorld.xz * 0.0016 + vec2(0.0, time * 0.06);
    float d = clouds(p);
    float cover = smoothstep(0.36, 0.6, d);
    vec2 toSun = normalize(sunDir.xz);
    float ds = clouds(p + toSun * 0.05);
    float lit = clamp(0.6 + (d - ds) * 4.0, 0.0, 1.0);
    vec3 shadowCol = vec3(0.45, 0.42, 0.56);
    vec3 litCol = vec3(1.0, 0.84, 0.72);
    vec3 col = mix(shadowCol, litCol, lit);
    vec3 below = vec3(0.17, 0.18, 0.26);
    vec3 base = mix(below, col, cover);
    vec3 view = normalize(vWorld - cameraPosition);
    base += vec3(1.0, 0.6, 0.3) * pow(max(dot(view, normalize(sunDir)), 0.0), 12.0) * 0.45 * cover;
    float dist = length(vWorld.xz - cameraPosition.xz);
    base = mix(base, haze, smoothstep(900.0, 6500.0, dist));
    gl_FragColor = vec4(pow(base, vec3(2.2)) * 1.25, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function buildSky(scene) {
  const world = new THREE.Group();
  scene.add(world);
  const sunDir = new THREE.Vector3(-0.38, 0.12, -1).normalize();

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { sunDir: { value: sunDir }, haze: { value: HAZE } },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8000, 48, 24), skyMat);
  world.add(dome);

  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, sunDir: { value: sunDir }, haze: { value: HAZE } },
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
  });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), cloudMat);
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = -650;
  world.add(deck);

  return {
    world,
    sunDir,
    roll: 0,
    pitch: 0,
    // A copy of the sky used to light the cockpit (reflections and ambient light).
    envScene() {
      const s = new THREE.Scene();
      s.add(dome.clone(), deck.clone());
      return s;
    },
    update(t) {
      cloudMat.uniforms.time.value = t;
      this.roll = Math.sin(t * 0.11) * 0.025 + Math.sin(t * 0.31) * 0.006;
      this.pitch = Math.sin(t * 0.21) * 0.008;
      world.rotation.z = this.roll;
    },
  };
}
