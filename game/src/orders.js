// The order board: tickets arrive, wait with a patience countdown, and expire.
// A ticket is a recipe plus the seconds of patience it has left.
import { RECIPES } from './config.js';
import { pick } from './random.js';

let nextTicketId = 1;

/** Build a ticket for a random recipe unlocked by this shift. */
export function makeTicket(rng, shift) {
  const unlocked = RECIPES.filter((recipe) => recipe.unlockShift <= shift.number);
  const recipe = pick(rng, unlocked);
  return {
    id: nextTicketId,
    recipe,
    patience: shift.patienceSeconds,
    patienceMax: shift.patienceSeconds,
    bornAt: 0,
  };
}

/** Order board: holds the live tickets, spawns new ones, and ages them. */
export class OrderBoard {
  constructor() {
    this.tickets = [];
    this.spawnTimer = 4; // first ticket arrives quickly so the kitchen is never empty
  }

  reset() {
    this.tickets = [];
    this.spawnTimer = 4;
    nextTicketId = 1;
  }

  /** Advance the board; returns the tickets that just expired. */
  update(dt, rng, shift) {
    const expired = [];
    for (const ticket of this.tickets) ticket.patience -= dt;
    for (let index = this.tickets.length - 1; index >= 0; index -= 1) {
      if (this.tickets[index].patience <= 0) expired.push(this.tickets.splice(index, 1)[0]);
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.tickets.length < shift.maxOrders) {
      const ticket = makeTicket(rng, shift);
      ticket.id = nextTicketId;
      nextTicketId += 1;
      this.tickets.push(ticket);
      this.spawnTimer = shift.spawnEverySeconds;
    }
    return expired;
  }

  /** The oldest ticket whose recipe matches the plate's ingredients exactly. */
  findMatch(plateIds) {
    const wanted = plateIds.slice().sort().join('|');
    return this.tickets.find((ticket) => ticket.recipe.needs.slice().sort().join('|') === wanted) ?? null;
  }

  /** Seconds of patience left on the oldest ticket, for the autopilot. */
  oldest() {
    return this.tickets[0] ?? null;
  }
}
