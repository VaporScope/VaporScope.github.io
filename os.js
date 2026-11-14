// The little desktop that runs on the cockpit's center display.
import { PROFILE, ABOUT, PROJECTS, EDUCATION, SKILLS, CV_FILES } from './content.js';

const svg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const ICONS = {
  plane: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>`,
  about: svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>'),
  projects: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  education: svg('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>'),
  skills: svg('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
  cv: svg('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  contact: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  terminal: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>'),
  external: svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  linkedin: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>'),
  github: svg('<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.3c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.5 0C6 1.4 4.9 1.7 4.9 1.7a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 3.4 8.7c0 5 3 6.2 6 6.5a3 3 0 0 0-.9 2.3V21"/>'),
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const emailAddress = () => `${PROFILE.emailUser}@${PROFILE.emailDomain}`;

const APPS = {
  about: { title: 'about.md', w: 580, h: 520, colors: ['#4f8cff', '#1d3f99'], render: renderAbout },
  projects: { title: 'projects', w: 640, h: 560, colors: ['#ffb547', '#c06a12'], render: renderProjects },
  education: { title: 'education', w: 560, h: 470, colors: ['#4fd1a1', '#13795b'], render: renderEducation },
  skills: { title: 'skills', w: 580, h: 480, colors: ['#b48cff', '#5b2fb3'], render: renderSkills },
  cv: { title: 'cv.pdf', w: 460, h: 330, colors: ['#ff6b6b', '#a3242f'], render: renderCV },
  contact: { title: 'contact', w: 460, h: 360, colors: ['#62e3f0', '#137a8a'], render: renderContact, mount: mountContact },
  terminal: { title: 'terminal', w: 580, h: 360, colors: ['#5b6472', '#20252d'], render: () => '', mount: mountTerminal },
};
const ORDER = ['about', 'projects', 'education', 'skills', 'cv', 'contact', 'terminal'];

function renderAbout() {
  return `
    <p class="kicker">~/about.md</p>
    <h2>${esc(ABOUT.title)}</h2>
    ${ABOUT.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
    <div class="status"><span class="status-dot" aria-hidden="true"></span><div><strong>Currently</strong><br>${esc(PROFILE.status)}</div></div>
    <div class="actions">
      <button class="btn" data-open="cv">Download my CV</button>
      <button class="btn ghost" data-open="contact">Contact me</button>
    </div>
    <dl class="facts">${ABOUT.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
}

function renderProjects() {
  return `
    <p class="kicker">~/projects</p>
    <h2>Things I've built</h2>
    ${PROJECTS.map(
      (p) => `
      <article class="card">
        <header class="card-head">
          <h3>${esc(p.name)} <span class="muted">· ${esc(p.subtitle)}</span></h3>
          <span class="date">${esc(p.date)}</span>
        </header>
        <p>${esc(p.summary)}</p>
        <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        ${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.urlLabel || 'Open')} ${ICONS.external}</a>` : ''}
      </article>`
    ).join('')}`;
}

function renderEducation() {
  return `
    <p class="kicker">~/education</p>
    <h2>Flight path so far</h2>
    <ol class="timeline">
      ${EDUCATION.map(
        (e) => `
        <li>
          <span class="tl-years">${esc(e.years)}</span>
          <h3>${esc(e.title)}</h3>
          <p class="muted">${esc(e.place)}</p>
          <p>${esc(e.detail)}</p>
        </li>`
      ).join('')}
    </ol>`;
}

function renderSkills() {
  return `
    <p class="kicker">~/skills</p>
    <h2>What I work with</h2>
    ${SKILLS.map(
      (g) => `
      <section class="skill-group">
        <h3>${esc(g.group)}</h3>
        <div class="tags">${g.items.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </section>`
    ).join('')}`;
}

function renderCV() {
  return `
    <p class="kicker">~/cv.pdf</p>
    <h2>My CV</h2>
    <p>One page, in English or French.</p>
    <div class="cv-grid">
      ${CV_FILES.map(
        (f) => `
        <a class="cv-card" href="${esc(f.file)}" target="_blank" rel="noopener">
          <span class="cv-ic">${ICONS.cv}</span>
          <span><strong>${esc(f.label)}</strong><br><span class="muted">PDF</span></span>
        </a>`
      ).join('')}
    </div>`;
}

function renderContact() {
  const links = [];
  if (PROFILE.linkedin) links.push(`<a class="btn ghost" href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener">${ICONS.linkedin} LinkedIn</a>`);
  if (PROFILE.github) links.push(`<a class="btn ghost" href="${esc(PROFILE.github)}" target="_blank" rel="noopener">${ICONS.github} GitHub</a>`);
  return `
    <p class="kicker">~/contact</p>
    <h2>Let's talk</h2>
    <p>The fastest way to reach me is by email. I reply within a day or two.</p>
    <div class="actions">
      <a class="btn" data-email>${ICONS.contact} <span data-email-text>Email me</span></a>
      <button class="btn ghost" data-copy>Copy address</button>
    </div>
    ${links.length ? `<div class="actions">${links.join('')}</div>` : ''}
    <p class="muted small">Based in the ${esc(PROFILE.location)}.</p>`;
}

function mountContact(el) {
  const a = el.querySelector('[data-email]');
  a.href = `mailto:${emailAddress()}`;
  el.querySelector('[data-email-text]').textContent = emailAddress();
  const copy = el.querySelector('[data-copy]');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailAddress());
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = emailAddress();
    }
    setTimeout(() => (copy.textContent = 'Copy address'), 1800);
  });
}

function mountTerminal(el, api) {
  el.classList.add('term');
  el.innerHTML = `<div class="term-out" aria-live="polite"></div>
    <form class="term-line"><span class="term-prompt">srayan@cockpit:~$</span><input class="term-in" autocomplete="off" spellcheck="false" aria-label="Terminal command"></form>`;
  const out = el.querySelector('.term-out');
  const input = el.querySelector('.term-in');
  const print = (txt, cls = '') => {
    const d = document.createElement('div');
    d.className = `term-row ${cls}`;
    d.textContent = txt;
    out.appendChild(d);
    el.scrollTop = el.scrollHeight;
  };
  print("Welcome aboard. Type 'help' to see what you can do.", 'dim');
  const cmds = {
    help: () => [
      'about  projects  education  skills  cv  contact   open a window',
      'whoami    who built this',
      'status    what I am looking for',
      'date      time in Paris',
      'ls        list everything',
      'clear     clear the screen',
      'exit      back to the cockpit',
    ],
    whoami: () => [`${PROFILE.name}, ${PROFILE.role}`],
    status: () => [PROFILE.status],
    date: () => [`${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Paris' })} (Paris)`],
    ls: () => [ORDER.filter((id) => id !== 'terminal').map((id) => APPS[id].title).join('   ')],
    clear: () => {
      out.innerHTML = '';
      return [];
    },
    exit: () => {
      setTimeout(api.exit, 300);
      return ['Leaving the display...'];
    },
    sudo: (args) => (args[0] === 'takeoff' ? ["Permission denied. Hire me first: type 'contact'."] : ['sudo: nice try.']),
  };
  for (const id of ['about', 'projects', 'education', 'skills', 'cv', 'contact']) {
    cmds[id] = () => {
      api.open(id);
      return [`Opening ${APPS[id].title}...`];
    };
  }
  el.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = '';
    print(`srayan@cockpit:~$ ${raw}`, 'cmd');
    if (!raw) return;
    const [c, ...args] = raw.split(/\s+/);
    const fn = cmds[c.toLowerCase()];
    (fn ? fn(args) : [`command not found: ${c}. Type 'help'.`]).forEach((l) => print(l));
  });
  el.addEventListener('pointerup', () => {
    if (!window.getSelection()?.toString()) input.focus();
  });
  setTimeout(() => input.focus(), 60);
}

export function createOS(root, { onExit }) {
  root.innerHTML = `
    <div class="os-wall" aria-hidden="true"><span class="os-wall-mark">srayan-os</span></div>
    <div class="os-menubar">
      <span class="os-logo">${ICONS.plane}</span>
      <strong class="os-brand">srayan-os</strong>
      <span class="os-active">desktop</span>
      <span class="os-spacer"></span>
      <span class="os-clock"></span>
      <button class="os-exit" type="button">Back to cockpit <kbd>Esc</kbd></button>
    </div>
    <div class="os-desktop">
      <nav class="os-icons" aria-label="Apps"></nav>
      <div class="os-windows"></div>
      <nav class="os-dock" aria-label="Dock"></nav>
    </div>
    <div class="os-boot" hidden></div>`;

  const desk = root.querySelector('.os-desktop');
  const layer = root.querySelector('.os-windows');
  const activeEl = root.querySelector('.os-active');
  const bootEl = root.querySelector('.os-boot');
  const exitBtn = root.querySelector('.os-exit');
  const tile = (id) => `<span class="ic" style="--c1:${APPS[id].colors[0]};--c2:${APPS[id].colors[1]}">${ICONS[id]}</span>`;

  root.querySelector('.os-icons').innerHTML = ORDER.map(
    (id) => `<button class="os-icon" type="button" data-open="${id}">${tile(id)}<span class="lbl">${APPS[id].title}</span></button>`
  ).join('');
  root.querySelector('.os-dock').innerHTML = ORDER.map(
    (id) => `<button class="dock-btn" type="button" data-open="${id}" data-dock="${id}" aria-label="Open ${APPS[id].title}">${tile(id)}<span class="dock-tip">${APPS[id].title}</span><span class="dock-dot"></span></button>`
  ).join('');

  const open = new Map();
  let z = 10;
  let cascade = 0;
  let booted = false;

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b && root.contains(b)) {
      e.preventDefault();
      openApp(b.dataset.open);
    }
  });
  exitBtn.addEventListener('click', () => onExit());

  function setActive(id) {
    activeEl.textContent = id ? APPS[id].title : 'desktop';
  }

  function focusWin(win, id) {
    win.style.zIndex = ++z;
    layer.querySelectorAll('.win').forEach((w) => w.classList.toggle('active', w === win));
    setActive(id);
  }

  function place(win, app) {
    const W = desk.clientWidth;
    const H = desk.clientHeight;
    const narrow = W < 700;
    const leftPad = narrow ? 8 : 116;
    const w = Math.min(app.w, W - leftPad - 12);
    const h = Math.min(app.h, H - 78);
    const n = cascade++ % 6;
    const x = Math.max(8, Math.min(leftPad + Math.max(0, (W - leftPad - w) / 2 - 60) + n * 28, W - w - 8));
    const y = Math.max(8, Math.min(14 + n * 24, H - h - 70));
    Object.assign(win.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  }

  function makeDraggable(win, bar) {
    let sx, sy, ox, oy, dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      ox = win.offsetLeft;
      oy = win.offsetTop;
      bar.setPointerCapture(e.pointerId);
      bar.classList.add('dragging');
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const W = desk.clientWidth;
      const H = desk.clientHeight;
      const x = Math.min(Math.max(ox + e.clientX - sx, 80 - win.offsetWidth), W - 80);
      const y = Math.min(Math.max(oy + e.clientY - sy, 0), H - 40);
      win.style.left = `${x}px`;
      win.style.top = `${y}px`;
    });
    const end = () => {
      dragging = false;
      bar.classList.remove('dragging');
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  }

  function openApp(id) {
    const app = APPS[id];
    if (!app) return;
    if (open.has(id)) {
      focusWin(open.get(id), id);
      return;
    }
    const win = document.createElement('section');
    win.className = 'win';
    win.setAttribute('aria-label', app.title);
    win.innerHTML = `
      <div class="win-bar">
        <div class="win-dots"><button class="dot close" type="button" aria-label="Close ${app.title}"></button><span class="dot min"></span><span class="dot max"></span></div>
        <div class="win-title">${ICONS[id]}<span>${app.title}</span></div>
      </div>
      <div class="win-body">${app.render()}</div>`;
    layer.appendChild(win);
    place(win, app);
    open.set(id, win);
    root.querySelector(`[data-dock="${id}"]`)?.classList.add('running');
    const body = win.querySelector('.win-body');
    if (app.mount) app.mount(body, { open: openApp, exit: onExit });
    win.addEventListener('pointerdown', () => focusWin(win, id));
    win.querySelector('.close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeApp(id);
    });
    makeDraggable(win, win.querySelector('.win-bar'));
    focusWin(win, id);
    requestAnimationFrame(() => win.classList.add('shown'));
  }

  function closeApp(id) {
    const win = open.get(id);
    if (!win) return;
    open.delete(id);
    root.querySelector(`[data-dock="${id}"]`)?.classList.remove('running');
    win.classList.remove('shown');
    setTimeout(() => win.remove(), 160);
    const rest = [...open.entries()].sort((a, b) => b[1].style.zIndex - a[1].style.zIndex);
    if (rest.length) focusWin(rest[0][1], rest[0][0]);
    else setActive(null);
  }

  function reflow() {
    const W = desk.clientWidth;
    const H = desk.clientHeight;
    if (!W || !H) return;
    for (const win of open.values()) {
      const w = Math.min(win.offsetWidth, W - 16);
      const h = Math.min(win.offsetHeight, H - 70);
      win.style.width = `${w}px`;
      win.style.height = `${h}px`;
      win.style.left = `${Math.max(8, Math.min(win.offsetLeft, W - w - 8))}px`;
      win.style.top = `${Math.max(8, Math.min(win.offsetTop, H - h - 60))}px`;
    }
  }

  const clockEl = root.querySelector('.os-clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const tick = () => (clockEl.textContent = `${fmt.format(new Date())} · Paris`);
  tick();
  setInterval(tick, 15000);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function boot() {
    bootEl.hidden = false;
    bootEl.innerHTML = '';
    const lines = [
      'SRAYAN-OS 1.0 · pre-flight check',
      'Avionics ............. OK',
      'Python backend ....... OK',
      'Prompt engine ........ OK',
      'Curiosity ............ 100%',
      'Cleared for takeoff.',
    ];
    for (const l of lines) {
      const d = document.createElement('div');
      d.textContent = l;
      bootEl.appendChild(d);
      await wait(170);
    }
    await wait(350);
    bootEl.classList.add('done');
    await wait(300);
    bootEl.hidden = true;
    bootEl.classList.remove('done');
    openApp('about');
  }

  return {
    show({ full = false, rect = null } = {}) {
      root.hidden = false;
      this.setFull(full);
      if (!full && rect) this.setRect(rect);
      requestAnimationFrame(() => root.classList.add('visible'));
      document.body.classList.add('in-os');
      if (!booted) {
        booted = true;
        boot();
      } else {
        requestAnimationFrame(reflow);
      }
    },
    hide() {
      root.classList.remove('visible');
      document.body.classList.remove('in-os');
      setTimeout(() => {
        if (!root.classList.contains('visible')) root.hidden = true;
      }, 320);
    },
    setFull(full) {
      root.classList.toggle('full', full);
      if (full) Object.assign(root.style, { left: '', top: '', width: '', height: '' });
      requestAnimationFrame(reflow);
    },
    setRect(r) {
      Object.assign(root.style, {
        left: `${Math.round(r.left)}px`,
        top: `${Math.round(r.top)}px`,
        width: `${Math.round(r.width)}px`,
        height: `${Math.round(r.height)}px`,
      });
      requestAnimationFrame(reflow);
    },
    setExitVisible(v) {
      exitBtn.hidden = !v;
    },
    open: openApp,
  };
}
