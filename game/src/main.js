// Sizzle & Serve — boot and game loop. Reads ?shot=start|play|end&seed=N for the
// deterministic screenshot scenes; otherwise runs the live game.
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { SoundFX } from './audio.js';
import { Kitchen, STEP } from './kitchen.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

const kitchen = new Kitchen(seed);
const sound = new SoundFX();
attachInput(canvas, kitchen, sound);
// Debug handle for automated play-testing (harmless in normal play).
window.__kitchen = kitchen;

const ctx = canvas.getContext('2d');
let time = 0;
let last = performance.now();
let accumulator = 0;
let shotStaged = false;

function describeState() {
  if (kitchen.screen === 'title') return 'Sizzle and Serve. Title screen. Press Enter to start cooking.';
  if (kitchen.screen === 'over') {
    return kitchen.won
      ? `Night complete! ${kitchen.coins} coins, ${kitchen.served} dishes served. Press R to play again.`
      : `Kitchen closed. ${kitchen.coins} coins, ${kitchen.served} dishes served. Press R to try again.`;
  }
  return `Shift ${kitchen.shift.number}, ${Math.ceil(kitchen.shiftTimeLeft)} seconds left, `
    + `${kitchen.coins} coins, ${kitchen.board.tickets.length} orders waiting.`;
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  time += dt;

  if (shotName) {
    if (!shotStaged) {
      stageShot(shotName, kitchen);
      shotStaged = true;
    }
    // Screenshot scenes are frozen frames: no live stepping, so the render is
    // identical every time the same seed is used.
  } else {
    accumulator += dt;
    while (accumulator >= STEP) {
      kitchen.step(STEP);
      accumulator -= STEP;
    }
    // Drain one-frame sound events into the sound effects.
    for (const event of kitchen.events) {
      if (event.type === 'click') sound.click();
      else if (event.type === 'chop') sound.chop();
      else if (event.type === 'sizzle') sound.sizzle();
      else if (event.type === 'serve') sound.coin();
      else if (event.type === 'wrong' || event.type === 'buzz') sound.buzz();
      else if (event.type === 'expired') sound.alarm();
      else if (event.type === 'burned') sound.buzz();
      else if (event.type === 'win') sound.win();
      else if (event.type === 'shift') sound.ding();
    }
    kitchen.events.length = 0;
    const nextStatus = describeState();
    if (status.textContent !== nextStatus) status.textContent = nextStatus;
  }

  render(ctx, kitchen, time, sound.muted);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
