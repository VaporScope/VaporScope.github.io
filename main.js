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
  const [THREE, { buildCockpit }, { buildSky }] = await Promise.all([import('three'), import('./cockpit.js'), import('./sky.js')]);
  await fontsReady();

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // nothing moves, so the shadows are drawn once
  $('#scene').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const fovFor = () => (innerWidth < innerHeight ? 74 : 58);
  const camera = new THREE.PerspectiveCamera(fovFor(), innerWidth / innerHeight, 0.02, 20000);

  const sky = buildSky(scene);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(sky.envScene(), 0.02, 0.1, 15000).texture;
  pmrem.dispose();

  const cockpit = await buildCockpit(scene, (p) => {
    startBtn.textContent = `Loading cockpit… ${Math.round(p * 100)}%`;
  });
  const SCREEN = cockpit.screenSize;

  // Low sunset sun, shining in through the windows
  const sun = new THREE.DirectionalLight(0xffc69e, 2.6);
  sun.position.copy(cockpit.center).addScaledVector(sky.sunDir, 30);
  sun.target.position.copy(cockpit.center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 70 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xb0bde8, 0x3a302c, 0.3));
  const panelLight = new THREE.PointLight(0xffe4c4, 1.6, 2.6, 2);
  panelLight.position.copy(cockpit.panelLight);
  scene.add(panelLight);
  renderer.shadowMap.needsUpdate = true;

  // Ambient occlusion (soft contact shadows) on computers; skipped on phones for speed.
  let composer = null;
  if (!isTouch && innerWidth >= 900) {
    try {
      const [{ EffectComposer }, { RenderPass }, { GTAOPass }, { OutputPass }] = await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/GTAOPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
      ]);
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
      ao.updateGtaoMaterial({ radius: 0.3, thickness: 1, distanceExponent: 1.5, scale: 1.2 });
      composer.addPass(ao);
      composer.addPass(new OutputPass());
    } catch (err) {
      console.warn('Ambient occlusion unavailable:', err);
      composer = null;
    }
  }
  const render = () => (composer ? composer.render() : renderer.render(scene, camera));

  const POSE = cockpit.poses;
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
      }, 1300);
    });
  }

  function focusScreen() {
    autoFocused = true;
    state = 'focusing';
    setHint(null);
    cockpit.setHover(false);
    renderer.domElement.style.cursor = '';
    const p = screenPose();
    flyTo(p, 1.5, () => {
      state = 'os';
      applyPose(p);
      const full = forcedFull || smallViewport();
      os.show({ full, rect: full ? null : screenRect() });
    });
  }

  function leaveScreen() {
    state = 'leaving';
    flyTo(POSE.home, 1.3, () => {
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
    if (composer) composer.setSize(innerWidth, innerHeight);
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
      const e2 = Math.min(1, dt * 2.5);
      look.x += (mouse.x - look.x) * e2;
      look.y += (mouse.y - look.y) * e2;
      const p = state === 'intro' ? POSE.intro : POSE.home;
      camera.position.copy(p.pos);
      if (!reduceMotion) {
        camera.position.y += Math.sin(t * 1.6) * 0.003 + Math.sin(t * 2.9) * 0.0015;
        camera.position.x += Math.sin(t * 1.1) * 0.002;
      }
      camTarget.copy(p.target);
      camTarget.x += look.x * 0.9;
      camTarget.y += look.y * 0.55;
    }
    camera.lookAt(camTarget);

    sky.update(t);
    cockpit.update(t, dt, { roll: sky.roll, pitch: sky.pitch, preview: state !== 'os' });

    if (state === 'cockpit' && !isTouch) {
      const over = hitScreen(mouse.px, mouse.py);
      cockpit.setHover(over);
      renderer.domElement.style.cursor = over ? 'pointer' : '';
    }
    render();
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
