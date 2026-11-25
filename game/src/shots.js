// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules
// forward from a fresh kitchen for a fixed number of steps, steered by the kitchen's
// own autopilot, so the frame is what a real game looks like and the same seed
// always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_SHIFT, SCREEN_TITLE, STEP } from './kitchen.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 30;
const END_LIMIT_SECONDS = 400;
const SAMPLE = STEP;

/**
 * Set `kitchen` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it.
 */
export function stageShot(name, kitchen) {
  kitchen.reset();
  if (name !== 'play' && name !== 'end') {
    // Title scene: a couple of orders on the board, one dish half-built on the plate.
    kitchen.screen = SCREEN_PLAY;
    for (let index = 0; index < START_SECONDS / SAMPLE; index += 1) kitchen.step(SAMPLE);
    kitchen.plate = ['bun', 'lettuce'];
    kitchen.stations.grill = { ingredientId: 'patty', progress: 5.5, burned: false };
    kitchen.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE };
  }
  kitchen.screen = SCREEN_PLAY;
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let index = 0; index < limit / SAMPLE; index += 1) {
    kitchen.autopilotStep();
    kitchen.step(SAMPLE);
    if (kitchen.screen === SCREEN_OVER) break;
    if (kitchen.screen === SCREEN_SHIFT) kitchen.continueFromShift();
    // The play scene wants a dish mid-assembly: stop once a plate is half-built
    // and a station is mid-cook, with orders still waiting.
    if (
      name === 'play' &&
      kitchen.plate.length >= 2 &&
      kitchen.board.tickets.length >= 1 &&
      Object.values(kitchen.stations).some((slot) => slot.ingredientId && slot.progress > 1)
    ) {
      break;
    }
    // The end scene wants a served dish on the board: stop after two serves.
    if (name === 'end' && kitchen.served >= 2) break;
  }
  if (kitchen.screen === SCREEN_OVER) return { screen: SCREEN_OVER };
  if (name === 'end') {
    // End scene: a finished plate ready to serve, coins on the board. Wait for a
    // ticket first — the board can be briefly empty right after a serve.
    for (let index = 0; index < 20 / SAMPLE && !kitchen.board.oldest(); index += 1) {
      kitchen.step(SAMPLE);
    }
    const ticket = kitchen.board.oldest();
    if (ticket) kitchen.plate = ticket.recipe.needs.slice();
    return { screen: SCREEN_PLAY };
  }
  return { screen: SCREEN_PLAY };
}
