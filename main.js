// Entry point: loads the 3D cockpit, handles the camera and opens the desktop on the center display.
import { PROFILE, CV_FILES } from './content.js';
import { createOS, ICONS, emailAddress } from './os.js';

const $ = (s) => document.querySelector(s);
const body = document.body;
const isTouch = matchMedia('(pointer: coarse)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Text and quick links ----------
for (const el of document.querySelectorAll('[data-bind]')) {
  const v = PROFILE[el.dataset.bind];
  if (v) el.textContent = v;
}
document.title = `${PROFILE.name} · Portfolio`;

const links = [
  `<a class="hud-link" href="mailto:${emailAddress()}">${ICONS.contact}<span>Email</span></a>`,
  `<a class="hud-link" href="${CV_FILES[0].file}" target="_blank" rel="noopener">${ICONS.cv}<span>CV</span></a>`,
];
if (PROFILE.linkedin) links.push(`<a class="hud-link" href="${PROFILE.linkedin}" target="_blank" rel="noopener">${ICONS.linkedin}<span>LinkedIn</span></a>`);
if (PROFILE.github) links.push(`<a class="hud-link" href="${PROFILE.github}" target="_blank" rel="noopener">${ICONS.github}<span>GitHub</span></a>`);
$('#hud-links').innerHTML = links.join('');

// ---------- Desktop ----------
const os = createOS($('#os'), { onExit: () => exitOS() });
let api3d = null;
let state = 'intro';
let forcedFull = false;

const hint = $('#hint');
function setHint(kind) {
  if (!kind) {
    hint.classList.add('off');
    return;
  }
  hint.textContent = isTouch
    ? 'Tap the center display to open the portfolio'
    : 'Move your mouse to look around · Click the center display to open the portfolio';
  hint.classList.remove('off');
}

function hideIntro() {
  $('#intro').classList.add('hide');
  body.classList.remove('intro-on');
}

function openSimple() {
  hideIntro();
  forcedFull = true;
  if (api3d) api3d.jumpToScreen();
  state = 'os';
  setHint(null);
  os.show({ full: true });
}

function exitOS() {
  if (!api3d || state !== 'os') return;
  os.hide();
  forcedFull = false;
  api3d.leaveScreen();
}

$('#simple-view').addEventListener('click', (e) => {
  e.preventDefault();
  openSimple();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state === 'os') exitOS();
});

const startBtn = $('#start-btn');
startBtn.addEventListener('click', () => (api3d ? api3d.start() : openSimple()));

function fallback(reason) {
  if (reason) console.warn('3D cockpit unavailable, using simple view:', reason);
  os.setExitVisible(false);
  startBtn.disabled = false;
  startBtn.textContent = 'OPEN PORTFOLIO';
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function fontsReady() {
  if (!document.fonts) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 16px "JetBrains Mono"'),
        document.fonts.load('700 32px "Inter"'),
        document.fonts.load('500 16px "Inter"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fonts are optional */
  }
}

if (!webglAvailable()) fallback('no WebGL');
else init3D().catch((err) => fallback(err));

// ---------- 3D ----------
async function init3D() {
  const [THREE, { buildCockpit, SCREEN }, { buildSky, HORIZON }] = await Promise.all([
    import('three'),
    import('./cockpit.js'),
    import('./sky.js'),
  ]);
  await fontsReady();

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  $('#scene').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HORIZON, 70, 720);
  const fovFor = () => (innerWidth < innerHeight ? 74 : 58);
  const camera = new THREE.PerspectiveCamera(fovFor(), innerWidth / innerHeight, 0.02, 3000);

  const sky = buildSky(scene);
  const cockpit = buildCockpit(scene);

  scene.add(new THREE.HemisphereLight(0xb9c6ff, 0x4a3530, 1.15));
  const sun = new THREE.DirectionalLight(0xffb07a, 2.6);
  sun.position.copy(sky.sunDir).multiplyScalar(300);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd6defe, 1.2);
  fill.position.set(0.6, 3, 5);
  scene.add(fill);
  const screenGlow = new THREE.PointLight(0x7fdcff, 1.6, 2.4, 2);
  screenGlow.position.set(0, 1.05, -0.55);
  scene.add(screenGlow);

  const POSE = {
    intro: { pos: new THREE.Vector3(0, 1.52, 1.25), target: new THREE.Vector3(0, 1.28, -1) },
    home: { pos: new THREE.Vector3(0, 1.42, 0.62), target: new THREE.Vector3(0, 1.17, -0.95) },
  };
  const camTarget = new THREE.Vector3();
  const applyPose = (p) => {
    camera.position.copy(p.pos);
    camTarget.copy(p.target);
    camera.lookAt(camTarget);
    camera.updateMatrixWorld();
  };
  applyPose(POSE.intro);

  // Camera pose that fills the window with the center display.
  function screenPose() {
    const m = cockpit.centerScreen;
    m.updateWorldMatrix(true, false);
    const P = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld);
    const N = new THREE.Vector3(0, 0, 1).transformDirection(m.matrixWorld);
    const half = THREE.MathUtils.degToRad(camera.fov) / 2;
    const fit = 0.9;
    const dh = SCREEN.h / 2 / Math.tan(half) / fit;
    const dw = SCREEN.w / 2 / (Math.tan(half) * camera.aspect) / fit;
    return { pos: P.clone().addScaledVector(N, Math.max(dh, dw)), target: P };
  }

  // Where the center display sits on the page, in CSS pixels.
  function screenRect() {
    const m = cockpit.centerScreen;
    const xs = [];
    const ys = [];
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = new THREE.Vector3((x * SCREEN.w) / 2, (y * SCREEN.h) / 2, 0).applyMatrix4(m.matrixWorld).project(camera);
      xs.push(((v.x + 1) / 2) * innerWidth);
      ys.push(((1 - v.y) / 2) * innerHeight);
    }
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
  }

  const smallViewport = () => innerWidth < 700 || innerHeight < 480;

  let tween = null;
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  function flyTo(p, dur, done) {
    tween = { p0: camera.position.clone(), t0: camTarget.clone(), p1: p.pos.clone(), t1: p.target.clone(), k: 0, dur: reduceMotion ? 0.01 : dur, done };
  }

  const look = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0, px: innerWidth / 2, py: innerHeight / 2 };
  let autoFocused = false;

  function start() {
    hideIntro();
    state = 'flying';
    setHint(null);
    flyTo(POSE.home, 2.0, () => {
      state = 'cockpit';
      look.x = look.y = 0;
      setHint('cockpit');
      setTimeout(() => {
        if (state === 'cockpit' && !autoFocused) {
          autoFocused = true;
          focusScreen();
        }
      }, 1100);
    });
  }

  function focusScreen() {
    autoFocused = true;
    state = 'focusing';
    setHint(null);
    cockpit.setHover(false);
    renderer.domElement.style.cursor = '';
    const p = screenPose();
    flyTo(p, 1.4, () => {
      state = 'os';
      applyPose(p);
      const full = forcedFull || smallViewport();
      os.show({ full, rect: full ? null : screenRect() });
    });
  }

  function leaveScreen() {
    state = 'leaving';
    flyTo(POSE.home, 1.2, () => {
      state = 'cockpit';
      look.x = look.y = 0;
      setHint('cockpit');
    });
  }

  function jumpToScreen() {
    tween = null;
    autoFocused = true;
    applyPose(screenPose());
  }

  // ---------- Input ----------
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / innerHeight) * 2 - 1);
    mouse.px = e.clientX;
    mouse.py = e.clientY;
  });
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitScreen = (x, y) => {
    ndc.set((x / innerWidth) * 2 - 1, -((y / innerHeight) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(cockpit.centerScreen, false).length > 0;
  };
  renderer.domElement.addEventListener('click', (e) => {
    if (state === 'cockpit' && hitScreen(e.clientX, e.clientY)) focusScreen();
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = fovFor();
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (state === 'os') {
      applyPose(screenPose());
      const full = forcedFull || smallViewport();
      os.setFull(full);
      if (!full) os.setRect(screenRect());
    }
  });

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (tween) {
      tween.k = Math.min(1, tween.k + dt / tween.dur);
      const k = ease(tween.k);
      camera.position.lerpVectors(tween.p0, tween.p1, k);
      camTarget.lerpVectors(tween.t0, tween.t1, k);
      if (tween.k >= 1) {
        const done = tween.done;
        tween = null;
        if (done) done();
      }
    } else if (state === 'cockpit' || state === 'intro') {
      const ease2 = Math.min(1, dt * 2.5);
      look.x += (mouse.x - look.x) * ease2;
      look.y += (mouse.y - look.y) * ease2;
      const p = state === 'intro' ? POSE.intro : POSE.home;
      camera.position.copy(p.pos);
      if (!reduceMotion) {
        camera.position.y += Math.sin(t * 1.6) * 0.003 + Math.sin(t * 2.9) * 0.0015;
        camera.position.x += Math.sin(t * 1.1) * 0.002;
      }
      camTarget.copy(p.target);
      camTarget.x += look.x * 0.6;
      camTarget.y += look.y * 0.35;
    }
    camera.lookAt(camTarget);

    sky.update(t, dt);
    cockpit.update(t, dt, { roll: sky.roll, pitch: sky.pitch, preview: state !== 'os' });

    if (state === 'cockpit' && !isTouch) {
      const over = hitScreen(mouse.px, mouse.py);
      cockpit.setHover(over);
      renderer.domElement.style.cursor = over ? 'pointer' : '';
    }
    renderer.render(scene, camera);
  }
  frame();

  api3d = { start, jumpToScreen, leaveScreen };
  if (state === 'os') {
    // The visitor opened the simple view while the cockpit was still loading.
    jumpToScreen();
  } else {
    startBtn.disabled = false;
    startBtn.textContent = 'START';
  }
}
