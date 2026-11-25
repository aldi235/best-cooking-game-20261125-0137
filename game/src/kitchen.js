// The kitchen: the whole game state — plate, cooking stations, coins, combo,
// strikes, shift timer — and every rule that changes it. Rendering and input live
// elsewhere; this file only decides what happens when the player acts.
import {
  COMBO_CAP, COMBO_STEP, INGREDIENT_BY_ID, MAX_STRIKES, PLATE_CAPACITY,
  RECIPES, SHIFTS, STATIONS, WRONG_SERVE_PENALTY,
} from './config.js';
import { createRng } from './random.js';
import { OrderBoard } from './orders.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_SHIFT = 'shift';
export const SCREEN_OVER = 'over';

export const STEP = 1 / 60;

/** A cooking station slot: at most one ingredient, with a cook timer. */
function emptyStation() {
  return { ingredientId: null, progress: 0, burned: false };
}

export class Kitchen {
  constructor(seed = 1) {
    this.rng = createRng(seed);
    this.seed = seed;
    this.board = new OrderBoard();
    this.reset();
  }

  reset() {
    this.screen = SCREEN_TITLE;
    this.shiftIndex = 0;
    this.shiftTimeLeft = SHIFTS[0].durationSeconds;
    this.shiftCoins = 0;
    this.coins = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.strikes = 0;
    this.served = 0;
    this.perfectServes = 0;
    this.plate = []; // ingredient ids, in the order they were plated
    this.stations = {
      grill: emptyStation(), chop: emptyStation(), oven: emptyStation(), pot: emptyStation(),
    };
    this.board.reset();
    this.message = '';
    this.messageTimer = 0;
    this.flash = null; // { text, color, until }
    this.won = false;
    this.paused = false;
    this.showHelp = false;
    this.elapsed = 0;
    this.servedThisShift = 0;
    this.events = []; // one-frame event flags consumed by the loop (sounds, toasts)
  }

  get shift() {
    return SHIFTS[this.shiftIndex];
  }

  get shiftTarget() {
    return this.shift.targetCoins;
  }

  startGame() {
    this.reset();
    this.screen = SCREEN_PLAY;
  }

  /** One fixed step of game time; `input` is the autopilot direction (unused here). */
  step(dt) {
    if (this.screen !== SCREEN_PLAY || this.paused) return;
    this.elapsed += dt;
    this.shiftTimeLeft -= dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;
    if (this.flash && this.elapsed > this.flash.until) this.flash = null;

    // Cook whatever sits on a station; overcook it and it burns.
    for (const [name, slot] of Object.entries(this.stations)) {
      if (!slot.ingredientId) continue;
      const station = STATIONS[name];
      slot.progress += dt;
      if (!slot.burned && slot.progress >= station.cookSeconds + station.burnSeconds) {
        slot.burned = true;
        this.events.push({ type: 'burned', station: name });
      }
    }

    const expired = this.board.update(dt, this.rng, this.shift);
    for (const ticket of expired) {
      this.strikes += 1;
      this.combo = 0;
      this.events.push({ type: 'expired', recipe: ticket.recipe.name });
      this.showFlash(`Order expired: ${ticket.recipe.name}!`, '#e63946');
      if (this.strikes >= MAX_STRIKES) return this.endGame(false);
    }

    if (this.shiftTimeLeft <= 0) this.advanceShift();
  }

  advanceShift() {
    if (this.shiftIndex >= SHIFTS.length - 1) {
      // Survived the final shift: win if the night's earnings met the target.
      return this.endGame(this.coins >= SHIFTS.reduce((sum, s) => sum + s.targetCoins, 0) * 0.8);
    }
    this.shiftIndex += 1;
    this.shiftTimeLeft = this.shift.durationSeconds;
    this.shiftCoins = 0;
    this.screen = SCREEN_SHIFT;
    this.events.push({ type: 'shift', shift: this.shift });
  }

  continueFromShift() {
    this.screen = SCREEN_PLAY;
  }

  endGame(won) {
    this.won = won;
    this.screen = SCREEN_OVER;
    this.events.push({ type: won ? 'win' : 'lose' });
  }

  showFlash(text, color) {
    this.flash = { text, color, until: this.elapsed + 2.2 };
  }

  setMessage(text) {
    this.message = text;
    this.messageTimer = 2.5;
  }

  // --- Player actions -------------------------------------------------------

  /** Click (or press a key for) an ingredient bin on the counter. */
  takeIngredient(ingredientId) {
    if (this.screen !== SCREEN_PLAY || this.paused) return false;
    const ingredient = INGREDIENT_BY_ID[ingredientId];
    if (!ingredient) return false;
    if (this.plate.includes(ingredientId)) {
      this.setMessage(`${ingredient.name} is already on the plate`);
      return false;
    }
    if (this.plate.length >= PLATE_CAPACITY) {
      this.setMessage('The plate is full — serve it or clear it');
      this.events.push({ type: 'buzz' });
      return false;
    }
    const stationName = ingredient.station;
    if (stationName) {
      const slot = this.stations[stationName];
      if (slot.ingredientId) {
        this.setMessage(`The ${STATIONS[stationName].label} is busy`);
        this.events.push({ type: 'buzz' });
        return false;
      }
      slot.ingredientId = ingredientId;
      slot.progress = 0;
      slot.burned = false;
      this.events.push({ type: stationName === 'chop' ? 'chop' : 'sizzle' });
      this.setMessage(`${ingredient.name} on the ${STATIONS[stationName].label}…`);
      return true;
    }
    this.plate.push(ingredientId);
    this.events.push({ type: 'click' });
    return true;
  }

  /** Click a cooking station: collect a finished item onto the plate, or bin a burnt one. */
  useStation(stationName) {
    if (this.screen !== SCREEN_PLAY || this.paused) return false;
    const slot = this.stations[stationName];
    if (!slot.ingredientId) return false;
    const station = STATIONS[stationName];
    if (slot.burned) {
      this.setMessage(`Burnt ${INGREDIENT_BY_ID[slot.ingredientId].name} — binned!`);
      this.events.push({ type: 'buzz' });
      this.stations[stationName] = emptyStation();
      return true;
    }
    if (slot.progress < station.cookSeconds) {
      this.setMessage(`Still cooking… ${Math.ceil(station.cookSeconds - slot.progress)}s to go`);
      return false;
    }
    if (this.plate.includes(slot.ingredientId)) {
      this.setMessage(`${INGREDIENT_BY_ID[slot.ingredientId].name} is already on the plate`);
      return false;
    }
    if (this.plate.length >= PLATE_CAPACITY) {
      this.setMessage('The plate is full — serve it first');
      return false;
    }
    this.plate.push(slot.ingredientId);
    this.events.push({ type: 'click' });
    this.stations[stationName] = emptyStation();
    return true;
  }

  /** Clear the plate (the bin beside it). */
  clearPlate() {
    if (this.screen !== SCREEN_PLAY || this.paused) return false;
    if (this.plate.length === 0) return false;
    this.plate = [];
    this.events.push({ type: 'click' });
    this.setMessage('Plate cleared');
    return true;
  }

  /** Serve the plate to the matching order, or take the penalty for a wrong dish. */
  serve() {
    if (this.screen !== SCREEN_PLAY || this.paused) return false;
    if (this.plate.length === 0) {
      this.setMessage('Nothing on the plate to serve');
      return false;
    }
    const ticket = this.board.findMatch(this.plate);
    if (!ticket) {
      this.coins = Math.max(0, this.coins - WRONG_SERVE_PENALTY);
      this.combo = 0;
      this.events.push({ type: 'wrong' });
      this.showFlash(`No order wants that dish! −${WRONG_SERVE_PENALTY} coins`, '#e63946');
      this.plate = [];
      return false;
    }
    // Tip: up to +50% of the price for serving with patience to spare.
    const patienceShare = Math.max(0, ticket.patience / ticket.patienceMax);
    const tip = Math.round(ticket.recipe.price * 0.5 * patienceShare);
    const multiplier = 1 + Math.min(this.combo, 10) * COMBO_STEP;
    const earned = Math.round((ticket.recipe.price + tip) * Math.min(multiplier, COMBO_CAP));
    this.coins += earned;
    this.shiftCoins += earned;
    this.score += earned * 10;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served += 1;
    this.servedThisShift += 1;
    if (patienceShare > 0.6) this.perfectServes += 1;
    this.board.tickets = this.board.tickets.filter((t) => t.id !== ticket.id);
    this.events.push({ type: 'serve', earned });
    this.showFlash(
      `${ticket.recipe.name} served! +${earned} coins${this.combo > 1 ? `  ·  combo x${multiplier.toFixed(1)}` : ''}`,
      '#2a9d8f',
    );
    this.plate = [];
    return true;
  }

  // --- Autopilot (drives the deterministic screenshot scenes) ---------------

  /** One autopilot decision per step: work the oldest order, station-first. */
  autopilotStep() {
    const ticket = this.board.oldest();
    if (!ticket) return;
    // First, collect anything finished on a station.
    for (const [name, slot] of Object.entries(this.stations)) {
      if (slot.ingredientId && !slot.burned && slot.progress >= STATIONS[name].cookSeconds) {
        this.useStation(name);
        return;
      }
      if (slot.ingredientId && slot.burned) {
        this.useStation(name);
        return;
      }
    }
    // Then take the next missing ingredient of the oldest order.
    for (const ingredientId of ticket.recipe.needs) {
      if (this.plate.includes(ingredientId)) continue;
      if (Object.values(this.stations).some((slot) => slot.ingredientId === ingredientId)) continue;
      this.takeIngredient(ingredientId);
      return;
    }
    // The plate is complete only when every needed ingredient is on it — never
    // serve a half-built dish (the station may still hold the last piece).
    if (ticket.recipe.needs.every((id) => this.plate.includes(id))) this.serve();
  }

  /** Recipe lookup for the recipe-book panel. */
  static recipesForShift(shiftNumber) {
    return RECIPES.filter((recipe) => recipe.unlockShift <= shiftNumber);
  }
}
