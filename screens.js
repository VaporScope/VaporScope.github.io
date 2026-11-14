// Cockpit displays, drawn on canvases and used as textures.
import * as THREE from 'three';
import { PROFILE, ROUTE } from './content.js';

const MONO = '"JetBrains Mono", Consolas, monospace';
const SANS = '"Inter", "Segoe UI", system-ui, sans-serif';
const C = { bg: '#04060a', white: '#e8eef5', green: '#3ee07f', cyan: '#62e3f0', amber: '#ffb547', magenta: '#e36bff', yellow: '#ffd23f', tape: '#1d2229' };

function canvasTex(w, h, s = 1) {
  const c = document.createElement('canvas');
  c.width = w * s;
  c.height = h * s;
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { ctx, tex };
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function tape(ctx, x, y, w, h, value, step, labelDiv) {
  ctx.save();
  ctx.fillStyle = C.tape;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const cy = y + h / 2;
  const pxPer = 24 / step;
  ctx.strokeStyle = C.white;
  ctx.fillStyle = C.white;
  ctx.lineWidth = 1.2;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const base = Math.floor(value / step) * step;
  for (let k = -5; k <= 6; k++) {
    const v = base + k * step;
    const yy = cy - (v - value) * pxPer;
    ctx.beginPath();
    ctx.moveTo(x + w - 6, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
    if (v % (step * 2) === 0) ctx.fillText(String(Math.round(v / labelDiv)), x + w / 2 - 3, yy);
  }
  ctx.restore();
  ctx.fillStyle = '#000';
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - 2, cy - 10, w + 4, 20);
  ctx.strokeRect(x - 2, cy - 10, w + 4, 20);
  ctx.fillStyle = C.green;
  ctx.font = `600 11px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(value)), x + w / 2, cy + 1);
}

// Primary flight display: artificial horizon, speed and altitude.
export function makePFD() {
  const { ctx, tex } = canvasTex(256, 256, 2);
  const draw = (t, roll = 0, pitch = 0) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 256, 256);
    ctx.save();
    rrect(ctx, 58, 40, 140, 150, 12);
    ctx.clip();
    ctx.translate(128, 115);
    ctx.rotate(-roll);
    const py = pitch * 300;
    ctx.fillStyle = '#2d6fd6';
    ctx.fillRect(-220, -320 + py, 440, 320);
    ctx.fillStyle = '#8a5a2c';
    ctx.fillRect(-220, py, 440, 320);
    ctx.strokeStyle = C.white;
    ctx.fillStyle = C.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-220, py);
    ctx.lineTo(220, py);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.font = `10px ${MONO}`;
    ctx.textBaseline = 'middle';
    for (let d = -30; d <= 30; d += 5) {
      if (!d) continue;
      const y = py - d * 4.2;
      const w = d % 10 === 0 ? 26 : 12;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      if (d % 10 === 0) {
        ctx.textAlign = 'left';
        ctx.fillText(String(Math.abs(d)), w + 4, y);
        ctx.textAlign = 'right';
        ctx.fillText(String(Math.abs(d)), -w - 4, y);
      }
    }
    ctx.restore();
    // roll scale
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(128, 115, 64, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.moveTo(128, 52);
    ctx.lineTo(122, 43);
    ctx.lineTo(134, 43);
    ctx.closePath();
    ctx.fill();
    // aircraft symbol
    const wings = () => {
      ctx.beginPath();
      ctx.moveTo(80, 115);
      ctx.lineTo(108, 115);
      ctx.lineTo(108, 123);
      ctx.moveTo(176, 115);
      ctx.lineTo(148, 115);
      ctx.lineTo(148, 123);
      ctx.stroke();
    };
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    wings();
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3.5;
    wings();
    ctx.fillStyle = C.yellow;
    ctx.fillRect(125, 112, 6, 6);
    // tapes
    tape(ctx, 10, 40, 40, 150, 250 + Math.sin(t * 0.7) * 1.5, 10, 1);
    tape(ctx, 206, 40, 42, 150, 35000 + Math.sin(t * 0.3) * 14, 100, 100);
    // heading strip
    ctx.fillStyle = C.tape;
    ctx.fillRect(58, 200, 140, 26);
    ctx.fillStyle = C.white;
    ctx.font = `600 12px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('26   27   28', 128, 213);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(127, 200, 2, 8);
    // mode annunciators
    ctx.font = `600 10px ${MONO}`;
    ctx.fillStyle = C.green;
    ctx.fillText('SPEED', 72, 18);
    ctx.fillText('NAV', 128, 18);
    ctx.fillText('ALT CRZ', 190, 18);
    ctx.fillStyle = C.white;
    ctx.fillText('AP1  A/THR', 128, 31);
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}

// Navigation display with a route to the next goal.
export function makeND({ vsd = false } = {}) {
  const { ctx, tex } = canvasTex(256, 256, 2);
  const draw = (t, hdg = 270) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 256, 256);
    const cx = 128;
    const cy = vsd ? 182 : 226;
    const r = vsd ? 140 : 178;
    const k = r / 178;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI + 0.62, Math.PI * 2 - 0.62);
    ctx.stroke();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = 'rgba(232,238,245,.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, r / 2, Math.PI + 0.62, Math.PI * 2 - 0.62);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.white;
    ctx.font = `600 11px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const start = Math.ceil((hdg - 34) / 5) * 5;
    for (let d = start; d <= hdg + 34; d += 5) {
      const ang = ((d - hdg - 90) * Math.PI) / 180;
      const len = d % 10 === 0 ? 10 : 5;
      ctx.strokeStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      ctx.lineTo(cx + Math.cos(ang) * (r - len), cy + Math.sin(ang) * (r - len));
      ctx.stroke();
      if (d % 30 === 0) ctx.fillText(String(((d % 360) + 360) % 360 / 10), cx + Math.cos(ang) * (r - 22), cy + Math.sin(ang) * (r - 22));
    }
    // heading box
    ctx.fillStyle = '#000';
    ctx.strokeStyle = C.white;
    ctx.fillRect(cx - 20, cy - r - 24, 40, 18);
    ctx.strokeRect(cx - 20, cy - r - 24, 40, 18);
    ctx.fillStyle = C.white;
    ctx.fillText(String(Math.round(hdg)).padStart(3, '0'), cx, cy - r - 15);
    // route
    const pts = [
      [cx, cy - 8],
      [cx + 20 * k, cy - 62 * k],
      [cx - 16 * k, cy - 112 * k],
      [cx + 8 * k, cy - 160 * k],
    ];
    ctx.strokeStyle = C.magenta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ROUTE.forEach((name, i) => {
      const [x, y] = pts[i + 1];
      const active = i === ROUTE.length - 1;
      ctx.strokeStyle = active ? C.magenta : C.white;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = active ? C.magenta : C.white;
      ctx.textAlign = 'left';
      ctx.fillText(name, x + 10, y);
    });
    // aircraft symbol
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy + 6);
    ctx.moveTo(cx - 12, cy - 8);
    ctx.lineTo(cx + 12, cy - 8);
    ctx.stroke();
    // data blocks
    ctx.font = `600 10px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.white;
    ctx.fillText('GS', 8, 12);
    ctx.fillStyle = C.green;
    ctx.fillText(String(452 + Math.round(Math.sin(t * 0.4) * 2)), 26, 12);
    ctx.fillStyle = C.white;
    ctx.fillText('TAS', 58, 12);
    ctx.fillStyle = C.green;
    ctx.fillText('471', 82, 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = C.magenta;
    ctx.fillText(ROUTE[ROUTE.length - 1], 248, 12);
    ctx.fillStyle = C.white;
    ctx.fillText('SUMMER 2027', 248, 26);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.cyan;
    if (!vsd) {
      ctx.fillText('ARC 40', 8, 246);
    } else {
      // Vertical situation display: terrain profile under the flight path
      ctx.strokeStyle = 'rgba(232,238,245,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(256, 200);
      ctx.stroke();
      ctx.fillStyle = '#1f7a34';
      ctx.beginPath();
      ctx.moveTo(30, 256);
      for (let x = 30; x <= 256; x += 6) {
        const u = x + t * 18;
        ctx.lineTo(x, 246 - (Math.sin(u * 0.05) * 4 + Math.sin(u * 0.13) * 3 + 7));
      }
      ctx.lineTo(256, 256);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = `600 9px ${MONO}`;
      ctx.textAlign = 'left';
      ['400', '200', '0'].forEach((v, i) => ctx.fillText(v, 4, 210 + i * 18));
      ctx.strokeStyle = C.magenta;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 212);
      ctx.lineTo(256, 212);
      ctx.stroke();
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.moveTo(40, 212);
      ctx.lineTo(32, 207);
      ctx.lineTo(32, 217);
      ctx.closePath();
      ctx.fill();
    }
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}

// Analog clock showing the time in Paris.
export function makeClock() {
  const { ctx, tex } = canvasTex(100, 100, 2);
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const hand = (angle, len, width, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-Math.sin(angle) * 6, Math.cos(angle) * 6);
    ctx.lineTo(Math.sin(angle) * len, -Math.cos(angle) * len);
    ctx.stroke();
  };
  const draw = () => {
    const [h, m, s] = fmt.format(new Date()).split(':').map(Number);
    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(0, 0, 100, 100);
    ctx.save();
    ctx.translate(50, 50);
    ctx.strokeStyle = C.white;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = i % 5 === 0 ? 38 : 42;
      ctx.lineWidth = i % 5 === 0 ? 2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1);
      ctx.lineTo(Math.sin(a) * 45, -Math.cos(a) * 45);
      ctx.stroke();
    }
    ctx.fillStyle = C.white;
    ctx.font = `600 9px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [[12, 0, -29], [3, 29, 0], [6, 0, 29], [9, -29, 0]].forEach(([n, x, y]) => ctx.fillText(String(n), x, y));
    ctx.font = `600 5px ${SANS}`;
    ctx.fillText('PARIS', 0, 14);
    hand((((h % 12) + m / 60) / 12) * Math.PI * 2, 20, 3, C.white);
    hand(((m + s / 60) / 60) * Math.PI * 2, 32, 2, C.white);
    hand((s / 60) * Math.PI * 2, 38, 1, C.amber);
    ctx.restore();
    tex.needsUpdate = true;
  };
  draw();
  return { tex, draw };
}

function gauge(ctx, cx, cy, r, frac, text) {
  const a0 = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.white;
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a0 + sweep * 0.85);
  ctx.stroke();
  ctx.strokeStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0 + sweep * 0.85, a0 + sweep);
  ctx.stroke();
  const a = a0 + sweep * Math.min(frac, 1);
  ctx.fillStyle = 'rgba(62,224,127,.18)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r - 2, a0, a);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.strokeStyle = 'rgba(232,238,245,.5)';
  ctx.lineWidth = 1;
  ctx.fillRect(cx + 2, cy + 6, r - 2, 18);
  ctx.strokeRect(cx + 2, cy + 6, r - 2, 18);
  ctx.fillStyle = C.green;
  ctx.font = `600 12px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx + 2 + (r - 2) / 2, cy + 16);
}

// Engine display.
export function makeEICAS() {
  const { ctx, tex } = canvasTex(256, 256, 2);
  const draw = (t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 256, 256);
    [70, 186].forEach((cx, i) => {
      const n1 = 92.4 + Math.sin(t * 0.9 + i) * 0.3;
      gauge(ctx, cx, 62, 40, n1 / 110, n1.toFixed(1));
      const egt = 640 + Math.sin(t * 0.5 + i * 2) * 6;
      gauge(ctx, cx, 150, 32, egt / 1000, String(Math.round(egt)));
    });
    ctx.fillStyle = C.cyan;
    ctx.font = `600 11px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('N1', 128, 62);
    ctx.fillText('EGT', 128, 150);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.white;
    ctx.fillText('FOB', 12, 212);
    ctx.fillStyle = C.green;
    ctx.fillText('18.4 T', 46, 212);
    ctx.fillStyle = C.white;
    ctx.fillText('GW', 140, 212);
    ctx.fillStyle = C.green;
    ctx.fillText('64.2 T', 168, 212);
    ctx.fillStyle = C.green;
    ctx.fillText('SEAT BELTS', 12, 236);
    ctx.fillText('NO SMOKING', 140, 236);
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}

// What the center display shows before you open it.
export function makeDesktopPreview(W = 1000, H = 640) {
  const yOff = (H - 640) / 2;
  const { ctx, tex } = canvasTex(W, H);
  const icons = [
    ['#4f8cff', '#1d3f99', 'about.md'],
    ['#ffb547', '#c06a12', 'projects'],
    ['#4fd1a1', '#13795b', 'education'],
    ['#b48cff', '#5b2fb3', 'skills'],
    ['#ff6b6b', '#a3242f', 'cv.pdf'],
    ['#62e3f0', '#137a8a', 'contact'],
  ];
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
  const draw = (t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1630');
    g.addColorStop(0.45, '#1d2f5c');
    g.addColorStop(0.76, '#6a4c7a');
    g.addColorStop(1, '#e08a6a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(W * 0.25, H * 1.1, 10, W * 0.25, H * 1.1, W * 0.7);
    rg.addColorStop(0, 'rgba(255,170,120,.5)');
    rg.addColorStop(1, 'rgba(255,170,120,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    // menubar
    ctx.fillStyle = 'rgba(7,10,15,.85)';
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = C.white;
    ctx.font = `600 17px ${SANS}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('srayan-os', 18, 18);
    ctx.textAlign = 'right';
    ctx.font = `15px ${MONO}`;
    ctx.fillStyle = '#aab4c0';
    ctx.fillText(`${clock.format(new Date())} · Paris`, W - 18, 18);
    // icons
    icons.forEach(([c1, c2, label], i) => {
      const x = 34;
      const y = 62 + i * 88;
      const ig = ctx.createLinearGradient(x, y, x + 52, y + 52);
      ig.addColorStop(0, c1);
      ig.addColorStop(1, c2);
      ctx.fillStyle = ig;
      rrect(ctx, x, y, 52, 52, 13);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = `14px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText(label, x + 26, y + 68);
    });
    // title
    const cx = (W + 120) / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.min(62, Math.round(W * 0.07))}px ${SANS}`;
    ctx.fillText(PROFILE.name, cx, 262 + yOff);
    ctx.font = `500 24px ${SANS}`;
    ctx.fillStyle = 'rgba(232,238,245,.85)';
    ctx.fillText(PROFILE.role, cx, 312 + yOff);
    // call to action
    const a = 0.55 + 0.45 * Math.sin(t * 3);
    rrect(ctx, cx - 160, 370 + yOff, 320, 60, 30);
    ctx.fillStyle = `rgba(98,227,240,${0.14 * a + 0.04})`;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(98,227,240,${0.4 + 0.6 * a})`;
    ctx.stroke();
    ctx.fillStyle = C.white;
    ctx.font = `600 22px ${MONO}`;
    ctx.fillText('CLICK TO OPEN', cx, 401 + yOff);
    // dock
    rrect(ctx, W / 2 - 190, H - 70, 380, 56, 16);
    ctx.fillStyle = 'rgba(10,14,20,.7)';
    ctx.fill();
    icons.forEach(([c1, c2], i) => {
      ctx.fillStyle = c1;
      rrect(ctx, W / 2 - 172 + i * 58, H - 61, 40, 40, 10);
      ctx.fill();
    });
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}
