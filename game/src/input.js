// Pointer and keyboard input: clicks hit the layout rectangles the renderer
// publishes, keys drive the same kitchen actions as the mouse does.
import { INGREDIENTS } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_SHIFT, SCREEN_TITLE } from './kitchen.js';
import { hitTest } from './render.js';

/** Wire a canvas to a kitchen; returns a detach function (unused by the game). */
export function attachInput(canvas, kitchen, sound) {
  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    sound.ensure();
    const point = canvasPoint(event);
    const hit = hitTest(point.x, point.y);
    if (!hit) return;
    if (hit.kind === 'bin') kitchen.takeIngredient(hit.id);
    else if (hit.kind === 'station') kitchen.useStation(hit.id);
    else if (hit.kind === 'serve') kitchen.serve();
    else if (hit.kind === 'clear') kitchen.clearPlate();
    else if (hit.kind === 'start' || hit.kind === 'restart') {
      if (kitchen.screen === SCREEN_TITLE || kitchen.screen === SCREEN_OVER) kitchen.startGame();
      else if (kitchen.screen === SCREEN_SHIFT) kitchen.continueFromShift();
    } else if (hit.kind === 'mute') {
      sound.toggleMute();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      sound.toggleMute();
      return;
    }
    if (key === 'h') {
      kitchen.showHelp = !kitchen.showHelp;
      return;
    }
    if (key === 'p') {
      if (kitchen.screen === SCREEN_PLAY) kitchen.paused = !kitchen.paused;
      return;
    }
    if (key === 'r') {
      kitchen.startGame();
      return;
    }
    if (kitchen.screen === SCREEN_TITLE && (key === 'enter' || key === ' ')) {
      kitchen.startGame();
      return;
    }
    if (kitchen.screen === SCREEN_SHIFT && (key === 'enter' || key === ' ')) {
      kitchen.continueFromShift();
      return;
    }
    if (kitchen.screen === SCREEN_OVER && (key === 'enter' || key === ' ')) {
      kitchen.startGame();
      return;
    }
    if (kitchen.screen !== SCREEN_PLAY || kitchen.paused || kitchen.showHelp) return;
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      kitchen.serve();
      return;
    }
    const ingredient = INGREDIENTS.find((ing) => ing.key === key);
    if (ingredient) {
      sound.ensure();
      kitchen.takeIngredient(ingredient.id);
    }
  });
}
