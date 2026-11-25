// Sizzle & Serve — every pixel the player sees, drawn in code on one canvas:
// the kitchen, the order board, the ingredient counter, the stations, the plate,
// the HUD and the title / shift / game-over screens. No images, no fonts loaded.
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, INGREDIENTS, RECIPES, STATIONS } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_SHIFT, SCREEN_TITLE } from './kitchen.js';

export const SCREEN_TITLE_SCREEN = SCREEN_TITLE;

/** Hit-test rectangles for the pointer, rebuilt every frame. */
export const layout = {
  bins: {},       // ingredient id -> rect
  stations: {},   // station name -> rect
  serve: null,
  clear: null,
  start: null,
  restart: null,
  help: null,
  mute: null,
  pause: null,
};

function rect(x, y, w, h) { return { x, y, w, h }; }
function inside(r, px, py) {
  return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
export function hitTest(px, py) {
  for (const [id, r] of Object.entries(layout.bins)) if (inside(r, px, py)) return { kind: 'bin', id };
  for (const [name, r] of Object.entries(layout.stations)) if (inside(r, px, py)) return { kind: 'station', id: name };
  if (inside(layout.serve, px, py)) return { kind: 'serve' };
  if (inside(layout.clear, px, py)) return { kind: 'clear' };
  if (inside(layout.start, px, py)) return { kind: 'start' };
  if (inside(layout.restart, px, py)) return { kind: 'restart' };
  if (inside(layout.help, px, py)) return { kind: 'help' };
  if (inside(layout.mute, px, py)) return { kind: 'mute' };
  if (inside(layout.pause, px, py)) return { kind: 'pause' };
  return null;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '400'} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Food drawing: each ingredient drawn with canvas shapes ----------------

export function drawIngredient(ctx, id, cx, cy, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  switch (id) {
    case 'bun': {
      ctx.fillStyle = '#e8a95c';
      ctx.beginPath(); ctx.arc(0, s * 0.15, s, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f7d08a';
      ctx.beginPath(); ctx.ellipse(0, s * 0.55, s * 0.95, s * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff3d6';
      [[-0.4, -0.25], [0.1, -0.45], [0.5, -0.15]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.ellipse(dx * s, dy * s, s * 0.12, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      });
      break;
    }
    case 'patty': {
      ctx.fillStyle = '#7a4a2b';
      roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a5a3b';
      roundRect(ctx, -s * 0.85, -s * 0.3, s * 1.7, s * 0.55, s * 0.25); ctx.fill();
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = '#7bc043';
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.45, 0, Math.PI * 2);
      }
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a5d86e';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tomato': {
      ctx.fillStyle = '#e63946';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f4a3a3';
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#588157';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.85, s * 0.35, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath(); ctx.moveTo(-s, s * 0.7); ctx.lineTo(0, -s * 0.85); ctx.lineTo(s, s * 0.7); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e09f3e';
      [[-0.3, 0.2], [0.25, 0.35], [0, -0.2]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.12, 0, Math.PI * 2); ctx.fill();
      });
      break;
    }
    case 'dough': {
      ctx.fillStyle = '#f2e3c6';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e0c89a';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'pepperoni': {
      ctx.fillStyle = '#c1121f';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e07a7a';
      [[-0.35, -0.3], [0.35, 0.25], [0.3, -0.4], [-0.3, 0.4]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.14, 0, Math.PI * 2); ctx.fill();
      });
      break;
    }
    case 'potato': {
      ctx.fillStyle = '#c89b6a';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.95, s * 0.7, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a67c52';
      [[-0.3, -0.1], [0.25, 0.2], [0.4, -0.25]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2); ctx.fill();
      });
      break;
    }
    case 'carrot': {
      ctx.fillStyle = '#f4842b';
      ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.2); ctx.lineTo(s * 0.7, 0); ctx.lineTo(-s * 0.45, s * 0.35); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#588157'; ctx.lineWidth = s * 0.16;
      ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.25); ctx.lineTo(-s * 0.8, -s * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.15); ctx.lineTo(-s * 0.55, -s * 0.85); ctx.stroke();
      break;
    }
    default: break;
  }
  ctx.restore();
}

// --- Scene pieces ----------------------------------------------------------

function drawKitchenShell(ctx, time) {
  // Warm tiled wall, wooden floor, long counter.
  ctx.fillStyle = COLORS.wall; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.wallDark;
  for (let y = 84; y < 300; y += 42) for (let x = (y % 84 === 0 ? 0 : 42); x < CANVAS_WIDTH; x += 84) {
    ctx.fillRect(x, y, 80, 38);
  }
  // Hanging lamps with a warm glow.
  for (const lx of [420, 640, 860]) {
    ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, 72); ctx.lineTo(lx, 108); ctx.stroke();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath(); ctx.moveTo(lx - 26, 108); ctx.lineTo(lx + 26, 108); ctx.lineTo(lx + 12, 132); ctx.lineTo(lx - 12, 132); ctx.closePath(); ctx.fill();
    const glow = ctx.createRadialGradient(lx, 130, 4, lx, 130, 90);
    glow.addColorStop(0, 'rgba(255,183,3,0.25)'); glow.addColorStop(1, 'rgba(255,183,3,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lx, 130, 90, 0, Math.PI * 2); ctx.fill();
  }
  // Window with a sunny street outside.
  ctx.fillStyle = '#8ecae6'; roundRect(ctx, 1000, 92, 240, 120, 10); ctx.fill();
  ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(1190, 122, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#588157'; ctx.fillRect(1000, 186, 240, 26);
  ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 6; roundRect(ctx, 1000, 92, 240, 120, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1120, 92); ctx.lineTo(1120, 212); ctx.moveTo(1000, 152); ctx.lineTo(1240, 152); ctx.stroke();
  // Floor and counter base.
  ctx.fillStyle = COLORS.floor; ctx.fillRect(0, 690, CANVAS_WIDTH, 110);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 0; x < CANVAS_WIDTH; x += 90) ctx.fillRect(x, 690, 3, 110);
  ctx.fillStyle = COLORS.counter; ctx.fillRect(0, 640, CANVAS_WIDTH, 50);
  ctx.fillStyle = COLORS.counterTop; ctx.fillRect(0, 640, CANVAS_WIDTH, 12);
  void time;
}

function drawHud(ctx, kitchen, muted) {
  ctx.fillStyle = COLORS.hud; ctx.fillRect(0, 0, CANVAS_WIDTH, 72);
  text(ctx, '🍳 SIZZLE & SERVE', 20, 38, 30, '#ffb703');
  text(ctx, `SHIFT ${kitchen.shift.number} · ${kitchen.shift.name}`, 330, 30, 17, COLORS.cream);
  text(ctx, `Target ${kitchen.shiftTarget} coins · earned ${kitchen.shiftCoins}`, 330, 52, 14, '#cbb89a', 'left', false);

  // Shift timer bar.
  const barX = 560; const barW = 300;
  ctx.fillStyle = '#4a3a28'; roundRect(ctx, barX, 18, barW, 20, 10); ctx.fill();
  const frac = Math.max(0, kitchen.shiftTimeLeft / kitchen.shift.durationSeconds);
  ctx.fillStyle = frac < 0.25 ? '#e63946' : '#2a9d8f';
  roundRect(ctx, barX, 18, barW * frac, 20, 10); ctx.fill();
  text(ctx, `⏱ ${Math.ceil(Math.max(0, kitchen.shiftTimeLeft))}s`, barX + barW / 2, 28, 15, '#fff', 'center');

  text(ctx, `💰 ${kitchen.coins}`, 900, 30, 24, '#ffd60a');
  text(ctx, `SCORE ${kitchen.score}`, 900, 54, 14, COLORS.cream);
  text(ctx, `COMBO x${(1 + Math.min(kitchen.combo, 10) * 0.1).toFixed(1)}`, 1030, 30, 17, kitchen.combo > 1 ? '#ffb703' : '#cbb89a');
  text(ctx, `served ${kitchen.served}`, 1030, 54, 14, '#cbb89a', 'left', false);
  // Strikes as three hearts.
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < kitchen.strikes ? '💔' : '❤️', 1160 + i * 26, 30, 20, '#fff');
  }
  text(ctx, 'P pause · M mute · H help', 1120, 54, 11, '#cbb89a', 'left', false);
  layout.mute = rect(1240, 8, 32, 24);
  text(ctx, muted ? '🔇' : '🔊', 1256, 20, 16, '#fff', 'center');
}

function drawOrderBoard(ctx, kitchen, time) {
  const x = 16; const y = 88; const w = 284;
  ctx.fillStyle = 'rgba(43,33,24,0.92)'; roundRect(ctx, x, y, w, 540, 14); ctx.fill();
  text(ctx, '📋 ORDER BOARD', x + 16, y + 26, 20, '#ffb703');
  if (kitchen.board.tickets.length === 0) {
    text(ctx, 'No orders yet —', x + 16, y + 90, 16, COLORS.cream, 'left', false);
    text(ctx, 'the rush is coming!', x + 16, y + 114, 16, COLORS.cream, 'left', false);
  }
  kitchen.board.tickets.forEach((ticket, index) => {
    const ty = y + 52 + index * 118;
    const urgent = ticket.patience < 12;
    ctx.fillStyle = urgent && Math.floor(time * 2) % 2 === 0 ? '#ffe8e8' : COLORS.ticket;
    roundRect(ctx, x + 12, ty, w - 24, 106, 10); ctx.fill();
    ctx.strokeStyle = urgent ? '#e63946' : '#d9c9a8'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, `#${ticket.id}  ${ticket.recipe.name}`, x + 24, ty + 20, 16, COLORS.ink);
    text(ctx, `$${ticket.recipe.price}`, x + w - 24, ty + 20, 16, '#2a9d8f', 'right');
    ticket.recipe.needs.forEach((ingId, i) => {
      const done = kitchen.plate.includes(ingId);
      drawIngredient(ctx, ingId, x + 40 + i * 44, ty + 58, 34);
      if (done) {
        ctx.strokeStyle = '#2a9d8f'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + 40 + i * 44, ty + 58, 20, 0, Math.PI * 2); ctx.stroke();
      }
    });
    // Patience bar.
    const frac = Math.max(0, ticket.patience / ticket.patienceMax);
    ctx.fillStyle = '#e5d9c0'; roundRect(ctx, x + 24, ty + 88, w - 48, 10, 5); ctx.fill();
    ctx.fillStyle = frac < 0.3 ? '#e63946' : '#2a9d8f';
    roundRect(ctx, x + 24, ty + 88, (w - 48) * frac, 10, 5); ctx.fill();
    text(ctx, `${Math.ceil(Math.max(0, ticket.patience))}s`, x + w - 24, ty + 80, 12, urgent ? '#e63946' : '#6b5a44', 'right', false);
  });
}

function drawStations(ctx, kitchen, time) {
  const names = Object.keys(STATIONS);
  text(ctx, '🔥 COOKING STATIONS — click a bin, then collect when ready', 330, 104, 15, COLORS.ink);
  names.forEach((name, i) => {
    const x = 330 + i * 162; const y = 116; const w = 148; const h = 118;
    const station = STATIONS[name];
    const slot = kitchen.stations[name];
    layout.stations[name] = rect(x, y, w, h);
    ctx.fillStyle = '#fffdf5'; roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, station.label, x + w / 2, y + 18, 15, COLORS.ink, 'center');
    // The station appliance.
    ctx.fillStyle = station.color;
    if (name === 'grill') {
      roundRect(ctx, x + 18, y + 44, w - 36, 34, 6); ctx.fill();
      ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
      for (let g = 0; g < 3; g += 1) { ctx.beginPath(); ctx.moveTo(x + 26, y + 54 + g * 9); ctx.lineTo(x + w - 26, y + 54 + g * 9); ctx.stroke(); }
      if (slot.ingredientId) { // flames
        ctx.fillStyle = Math.floor(time * 6) % 2 === 0 ? '#ff8500' : '#ffb703';
        ctx.beginPath(); ctx.moveTo(x + 40, y + 44); ctx.quadraticCurveTo(x + 50, y + 26, x + 60, y + 44); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 86, y + 44); ctx.quadraticCurveTo(x + 96, y + 30, x + 106, y + 44); ctx.closePath(); ctx.fill();
      }
    } else if (name === 'chop') {
      ctx.fillStyle = '#8a5a33'; roundRect(ctx, x + 18, y + 44, w - 36, 34, 6); ctx.fill();
      ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.moveTo(x + 40, y + 44); ctx.lineTo(x + w - 40, y + 44); ctx.lineTo(x + w - 30, y + 56); ctx.lineTo(x + 50, y + 56); ctx.closePath(); ctx.fill();
    } else if (name === 'oven') {
      roundRect(ctx, x + 18, y + 40, w - 36, 42, 6); ctx.fill();
      ctx.fillStyle = '#ffb703'; ctx.fillRect(x + 30, y + 52, w - 60, 18);
      ctx.fillStyle = '#2b2118'; ctx.fillRect(x + 30, y + 52, w - 60, 4);
    } else {
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + 62, (w - 40) / 2, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8ecae6'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 60, (w - 52) / 2, 11, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (slot.ingredientId) {
      drawIngredient(ctx, slot.ingredientId, x + w / 2, y + 62, 40);
      const frac = Math.min(1, slot.progress / station.cookSeconds);
      ctx.fillStyle = '#e5d9c0'; roundRect(ctx, x + 18, y + 92, w - 36, 10, 5); ctx.fill();
      ctx.fillStyle = slot.burned ? '#e63946' : frac >= 1 ? '#2a9d8f' : '#ffb703';
      roundRect(ctx, x + 18, y + 92, (w - 36) * frac, 10, 5); ctx.fill();
      if (slot.burned) text(ctx, 'BURNT! click to bin it', x + w / 2, y + 112, 11, '#e63946', 'center');
      else if (frac >= 1) text(ctx, 'READY — click to plate!', x + w / 2, y + 112, 11, '#2a9d8f', 'center');
      else text(ctx, `${Math.ceil(station.cookSeconds - slot.progress)}s…`, x + w / 2, y + 112, 11, '#6b5a44', 'center');
    } else {
      text(ctx, 'empty', x + w / 2, y + 96, 13, '#a89a80', 'center', false);
    }
  });
}

function drawBins(ctx, kitchen) {
  text(ctx, '🥕 INGREDIENT COUNTER — click or press 1–9', 330, 262, 15, COLORS.ink);
  INGREDIENTS.forEach((ing, i) => {
    const col = i % 5; const row = Math.floor(i / 5);
    const x = 330 + col * 130; const y = 276 + row * 92; const w = 118; const h = 80;
    layout.bins[ing.id] = rect(x, y, w, h);
    const onPlate = kitchen.plate.includes(ing.id);
    const cooking = Object.values(kitchen.stations).some((slot) => slot.ingredientId === ing.id);
    ctx.fillStyle = onPlate ? '#d8f3dc' : cooking ? '#ffe8b3' : '#fffdf5';
    roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = onPlate ? '#2a9d8f' : '#d9c9a8'; ctx.lineWidth = onPlate ? 3 : 2; ctx.stroke();
    drawIngredient(ctx, ing.id, x + w / 2, y + 30, 42);
    text(ctx, ing.name, x + w / 2, y + 62, 13, COLORS.ink, 'center');
    text(ctx, ing.key, x + 10, y + 12, 11, '#a89a80', 'left', false);
    if (ing.station) text(ctx, `→ ${STATIONS[ing.station].label}`, x + w - 8, y + 12, 10, '#b08968', 'right', false);
    if (onPlate) text(ctx, '✓ plated', x + w / 2, y + 74, 10, '#2a9d8f', 'center');
  });
}

function drawPlate(ctx, kitchen, time) {
  const cx = 560; const cy = 578;
  text(ctx, '🍽️ YOUR PLATE — build the dish, then SERVE', 330, 478, 15, COLORS.ink);
  // Platter with a soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 84, 190, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8f9fa'; ctx.beginPath(); ctx.ellipse(cx, cy, 185, 82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8c0c8'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#e9ecef'; ctx.beginPath(); ctx.ellipse(cx, cy, 150, 62, 0, 0, Math.PI * 2); ctx.fill();
  // Stack the plated ingredients as a little dish pile.
  if (kitchen.plate.length === 0) {
    text(ctx, 'empty plate — pick ingredients above', cx, cy, 16, '#a89a80', 'center', false);
  } else {
    kitchen.plate.forEach((ingId, i) => {
      const offset = (i - (kitchen.plate.length - 1) / 2) * 52;
      drawIngredient(ctx, ingId, cx + offset, cy - 6 - (i % 2) * 8, 56);
    });
  }
  // Steam wisps above a fresh plate.
  if (kitchen.plate.length > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const sx = cx - 60 + i * 60;
      const sway = Math.sin(time * 2 + i * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(sx, cy - 46);
      ctx.quadraticCurveTo(sx + sway, cy - 64, sx - sway, cy - 86);
      ctx.stroke();
    }
  }
  // Serve + clear buttons.
  layout.serve = rect(790, 500, 170, 64);
  ctx.fillStyle = kitchen.plate.length > 0 ? '#2a9d8f' : '#9db5a0';
  roundRect(ctx, 790, 500, 170, 64, 14); ctx.fill();
  text(ctx, 'SERVE  ⏎', 875, 532, 24, '#fff', 'center');
  layout.clear = rect(790, 576, 170, 40);
  ctx.fillStyle = '#e9c46a'; roundRect(ctx, 790, 576, 170, 40, 10); ctx.fill();
  text(ctx, '🗑 Clear plate', 875, 596, 15, COLORS.ink, 'center');
  if (kitchen.message && kitchen.messageTimer > 0) {
    text(ctx, kitchen.message, 875, 648, 14, '#fff6e5', 'center', false);
  }
}

function drawRecipeBook(ctx, kitchen) {
  const x = 992; const y = 88; const w = 272;
  ctx.fillStyle = 'rgba(43,33,24,0.92)'; roundRect(ctx, x, y, w, 540, 14); ctx.fill();
  text(ctx, '📖 RECIPES', x + 16, y + 26, 20, '#ffb703');
  RECIPES.forEach((recipe, index) => {
    const ry = y + 52 + index * 108;
    const unlocked = recipe.unlockShift <= kitchen.shift.number;
    ctx.fillStyle = unlocked ? COLORS.ticket : 'rgba(255,253,245,0.45)';
    roundRect(ctx, x + 12, ry, w - 24, 96, 10); ctx.fill();
    text(ctx, `${recipe.name}  $${recipe.price}`, x + 24, ry + 20, 15, unlocked ? COLORS.ink : '#8a7a64');
    if (!unlocked) {
      text(ctx, `unlocks in Shift ${recipe.unlockShift}`, x + 24, ry + 46, 13, '#8a7a64', 'left', false);
      return;
    }
    recipe.needs.forEach((ingId, i) => drawIngredient(ctx, ingId, x + 40 + i * 44, ry + 56, 32));
    text(ctx, recipe.blurb, x + 24, ry + 84, 12, '#6b5a44', 'left', false);
  });
  text(ctx, 'Tip: serve fast for a bigger tip.', x + 16, y + 500, 13, '#cbb89a', 'left', false);
  text(ctx, 'Consecutive serves build a combo.', x + 16, y + 522, 13, '#cbb89a', 'left', false);
}

function drawFlash(ctx, kitchen) {
  if (!kitchen.flash) return;
  ctx.fillStyle = kitchen.flash.color;
  ctx.globalAlpha = 0.92;
  const w = 560;
  roundRect(ctx, (CANVAS_WIDTH - w) / 2, 84, w, 44, 12); ctx.fill();
  ctx.globalAlpha = 1;
  text(ctx, kitchen.flash.text, CANVAS_WIDTH / 2, 106, 19, '#fff', 'center');
}

function overlay(ctx, title, lines, buttonLabel) {
  ctx.fillStyle = 'rgba(20,14,8,0.72)'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#fff6e5'; roundRect(ctx, 340, 150, 600, 470, 18); ctx.fill();
  ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, title, 640, 210, 40, COLORS.ink, 'center');
  lines.forEach((line, i) => text(ctx, line.text, 640, 280 + i * 34, line.size || 18, line.color || COLORS.ink, 'center', line.bold !== false));
  if (buttonLabel) {
    layout.start = rect(490, 540, 300, 60);
    ctx.fillStyle = '#2a9d8f'; roundRect(ctx, 490, 540, 300, 60, 14); ctx.fill();
    text(ctx, buttonLabel, 640, 570, 24, '#fff', 'center');
  }
  layout.restart = layout.start;
}

export function render(ctx, kitchen, time, muted) {
  drawKitchenShell(ctx, time);
  if (kitchen.screen === SCREEN_TITLE) {
    drawHud(ctx, kitchen, muted);
    drawOrderBoard(ctx, kitchen, time);
    drawStations(ctx, kitchen, time);
    drawBins(ctx, kitchen);
    drawPlate(ctx, kitchen, time);
    drawRecipeBook(ctx, kitchen);
    overlay(ctx, '🍳 SIZZLE & SERVE', [
      { text: 'Run the busiest kitchen in town!', size: 20 },
      { text: 'Orders roll in — chop, grill, bake and plate', size: 17, color: '#6b5a44' },
      { text: 'each dish exactly as the ticket asks.', size: 17, color: '#6b5a44' },
      { text: 'Serve fast for tips. 3 expired orders ends the night.', size: 17, color: '#6b5a44' },
      { text: 'Click ingredients (or keys 1–9) · Enter serves · R restarts', size: 15, color: '#8a7a64' },
    ], '▶ START COOKING');
    return;
  }
  drawHud(ctx, kitchen, muted);
  drawOrderBoard(ctx, kitchen, time);
  drawStations(ctx, kitchen, time);
  drawBins(ctx, kitchen);
  drawPlate(ctx, kitchen, time);
  drawRecipeBook(ctx, kitchen);
  drawFlash(ctx, kitchen);

  if (kitchen.showHelp) {
    overlay(ctx, 'HOW TO PLAY', [
      { text: '1. Read the ticket on the order board.', size: 17, color: '#6b5a44' },
      { text: '2. Click ingredient bins (or keys 1–9).', size: 17, color: '#6b5a44' },
      { text: '3. Patty → grill, dough → oven, veg → chopper,', size: 17, color: '#6b5a44' },
      { text: '    potato → pot. Collect when READY, before it burns!', size: 17, color: '#6b5a44' },
      { text: '4. Press Enter (or SERVE) when the plate matches a ticket.', size: 17, color: '#6b5a44' },
      { text: 'Fast serves earn tips; streaks build a combo.', size: 17, color: '#6b5a44' },
      { text: 'P pause · M mute · R restart · H close this help', size: 15, color: '#8a7a64' },
    ], null);
    layout.start = null;
    return;
  }
  if (kitchen.paused) {
    overlay(ctx, '⏸ PAUSED', [{ text: 'Press P to keep cooking', size: 18, color: '#6b5a44' }], null);
    layout.start = null;
    return;
  }
  if (kitchen.screen === SCREEN_SHIFT) {
    overlay(ctx, `SHIFT ${kitchen.shiftIndex} COMPLETE!`, [
      { text: `Coins so far: ${kitchen.coins}  ·  Served: ${kitchen.served}`, size: 18 },
      { text: `Next up: ${kitchen.shift.name} — faster orders, new recipes!`, size: 17, color: '#6b5a44' },
      { text: `Shift target: ${kitchen.shiftTarget} coins`, size: 17, color: '#6b5a44' },
    ], '▶ START SHIFT ' + kitchen.shift.number);
    return;
  }
  if (kitchen.screen === SCREEN_OVER) {
    const totalTarget = 200; // 80% of the three shifts' targets (55 + 85 + 110)
    overlay(ctx, kitchen.won ? '🏆 NIGHT COMPLETE!' : '💔 KITCHEN CLOSED', [
      { text: kitchen.won ? 'You survived the rush — the crowd loves you!' : 'Three orders walked out. The night is over.', size: 18 },
      { text: `Coins earned: ${kitchen.coins}  ·  Dishes served: ${kitchen.served}`, size: 18 },
      { text: `Best combo: x${(1 + Math.min(kitchen.bestCombo, 10) * 0.1).toFixed(1)}  ·  Perfect serves: ${kitchen.perfectServes}`, size: 17, color: '#6b5a44' },
      { text: kitchen.won ? `Target was ${totalTarget} coins — you made it!` : `Target was ${totalTarget} coins — try again, chef!`, size: 17, color: '#6b5a44' },
    ], '↻ PLAY AGAIN (R)');
  }
}
