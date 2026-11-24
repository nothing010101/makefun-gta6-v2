// SOLMAR HEAT II — config.js
// Tunables for the whole game: an 11x11-block sun-soaked coastal city,
// arcade driving, 4 weapon tiers, 5-star police, 10 story missions,
// garage cars, street races, respect ranks and crew unlocks.
export const CFG = {
  cityBlocks: 11,
  blockSize: 30,
  roadWidth: 10,
  step: 40, // blockSize + roadWidth
  cityHalf: 220,
  seaZ: 232,
  beachZ: 208,
  walkSpeed: 6,
  runSpeed: 11,
  carAccel: 24,
  carMaxSpeed: 44,
  carBrake: 36,
  carTurn: 2.0,
  playerHealth: 100,
  playerArmor: 50,
  startMoney: 500,
  wantedDecay: 0.03,
  hiddenDecay: 0.12,
  policeMax: 6,
  pedCount: 34,
  trafficCount: 18,
  parkedCount: 8,
  colors: {
    sky: 0x8ec9ea, sun: 0xfff2cc, ground: 0x5f7a52, sidewalk: 0x9a9a92,
    road: 0x2b2b2e, sand: 0xe8d29a, sea: 0x1e7fa8, grass: 0x4f9e4d,
    building: [0xd8c9a3, 0xc9a06a, 0x8fb8c9, 0xe8e0d0, 0xb98a7a, 0x7fa8a0, 0xd8b25a, 0x6a8ab8],
    neonPink: 0xff2e88, neonCyan: 0x00e5ff, neonGold: 0xffc233,
  },
};

export const STORY = {
  hero: 'Jax Moreno',
  fixer: 'Marisol Vega',
  shooter: 'Rico Delgado',
  villain: 'Kane Rooker',
  city: 'Solmar City',
};

// Weapon tiers: 0 = fists, 1 = Pistol, 2 = SMG, 3 = Shotgun, 4 = Rifle.
export const WEAPONS = [
  { id: 0, name: 'Tinju', dmg: 1, rate: 0.45, mag: 0, price: 0, ammoPrice: 0, range: 2.4, spread: 1, auto: false },
  { id: 1, name: 'Pistol P9', dmg: 1, rate: 0.32, mag: 12, price: 300, ammoPrice: 40, range: 46, spread: 1, auto: false },
  { id: 2, name: 'SMG Viper', dmg: 1, rate: 0.09, mag: 30, price: 1500, ammoPrice: 90, range: 40, spread: 1, auto: true },
  { id: 3, name: 'Shotgun Boom', dmg: 1, rate: 0.85, mag: 6, price: 2200, ammoPrice: 120, range: 22, spread: 5, auto: false },
  { id: 4, name: 'Rifle Falcon', dmg: 2, rate: 0.13, mag: 30, price: 4500, ammoPrice: 150, range: 70, spread: 1, auto: true },
];

// Garage catalogue: respect rank gates the faster cars.
export const GARAGE_CARS = [
  { id: 'vento', name: 'Vento S', color: 0x2a6ad2, price: 1200, topSpeed: 46, accel: 24, rank: 0 },
  { id: 'comet', name: 'Comet GT', color: 0xd23b3b, price: 2600, topSpeed: 56, accel: 30, rank: 1 },
  { id: 'bison', name: 'Bison 4x4', color: 0x2ad27a, price: 4200, topSpeed: 50, accel: 26, rank: 2 },
  { id: 'falco', name: 'Falco X', color: 0xffc233, price: 8000, topSpeed: 66, accel: 36, rank: 3 },
];

export const RESPECT_RANKS = [
  { name: 'Rookie', need: 0 },
  { name: 'Hustler', need: 40 },
  { name: 'Wheelman', need: 120 },
  { name: 'Kingpin', need: 260 },
];

export function respectRank(respect) {
  let r = 0;
  for (let i = 0; i < RESPECT_RANKS.length; i++) if (respect >= RESPECT_RANKS[i].need) r = i;
  return r;
}

export const SAVE_KEY = 'solmar-heat-2-save-v1';
