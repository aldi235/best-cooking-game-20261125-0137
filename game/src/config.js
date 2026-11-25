// Sizzle & Serve — configuration: canvas size, ingredients, recipes, shifts.
// Every tuneable number of the game lives here so the other files read like rules,
// not arithmetic.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

// Ingredient ids in counter order; keys 1-9 pick them.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8a95c', station: null, price: 2 },
  { id: 'patty', name: 'Patty', key: '2', color: '#8a5a3b', station: 'grill', price: 4 },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#7bc043', station: 'chop', price: 1 },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#e63946', station: 'chop', price: 2 },
  { id: 'cheese', name: 'Cheese', key: '5', color: '#ffc93c', station: null, price: 2 },
  { id: 'dough', name: 'Dough', key: '6', color: '#f2e3c6', station: 'oven', price: 3 },
  { id: 'pepperoni', name: 'Pepperoni', key: '7', color: '#c1121f', station: null, price: 3 },
  { id: 'potato', name: 'Potato', key: '8', color: '#c89b6a', station: 'pot', price: 2 },
  { id: 'carrot', name: 'Carrot', key: '9', color: '#f4842b', station: 'chop', price: 2 },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// Cooking stations: what they cook, how long, and how long before it burns.
export const STATIONS = {
  grill: { label: 'GRILL', cookSeconds: 7, burnSeconds: 8, color: '#3d3d3d' },
  chop: { label: 'CHOP', cookSeconds: 3, burnSeconds: 999, color: '#6b4f2a' },
  oven: { label: 'OVEN', cookSeconds: 6, burnSeconds: 7, color: '#4a2c2a' },
  pot: { label: 'POT', cookSeconds: 6, burnSeconds: 9, color: '#2e4a5a' },
};

// Recipes: the dishes customers order. `needs` lists ingredient ids; the plate must
// hold exactly this set (order does not matter) to serve it.
export const RECIPES = [
  {
    id: 'burger', name: 'Sizzle Burger', price: 14, unlockShift: 1,
    needs: ['bun', 'patty', 'lettuce', 'tomato'],
    blurb: 'Bun, grilled patty, lettuce, tomato',
  },
  {
    id: 'salad', name: 'Garden Salad', price: 9, unlockShift: 1,
    needs: ['lettuce', 'tomato', 'carrot'],
    blurb: 'Lettuce, tomato, carrot — chop it fresh',
  },
  {
    id: 'pizza', name: 'Pepperoni Pizza', price: 16, unlockShift: 2,
    needs: ['dough', 'cheese', 'tomato', 'pepperoni'],
    blurb: 'Baked dough, cheese, tomato, pepperoni',
  },
  {
    id: 'soup', name: 'Harvest Soup', price: 12, unlockShift: 3,
    needs: ['potato', 'carrot', 'tomato'],
    blurb: 'Potato & carrot simmered in the pot',
  },
];

// One shift (level) of the dinner rush.
export const SHIFTS = [
  { number: 1, name: 'Lunch Rush', durationSeconds: 100, targetCoins: 55, spawnEverySeconds: 13, patienceSeconds: 50, maxOrders: 3 },
  { number: 2, name: 'Dinner Rush', durationSeconds: 110, targetCoins: 85, spawnEverySeconds: 11, patienceSeconds: 44, maxOrders: 4 },
  { number: 3, name: 'Midnight Rush', durationSeconds: 120, targetCoins: 110, spawnEverySeconds: 9, patienceSeconds: 38, maxOrders: 4 },
];

export const MAX_STRIKES = 3;
export const WRONG_SERVE_PENALTY = 5;
export const PLATE_CAPACITY = 5;
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 2.0;

// Warm kitchen palette.
export const COLORS = {
  wall: '#f7e8d0',
  wallDark: '#efd9b8',
  floor: '#c98f5f',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  steel: '#b8c0c8',
  hud: '#2b2118',
  cream: '#fff6e5',
  ink: '#2b2118',
  gold: '#ffb703',
  green: '#588157',
  red: '#c1121f',
  ticket: '#fffdf5',
};
