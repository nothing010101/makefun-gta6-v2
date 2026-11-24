// SOLMAR HEAT II — weapons.js
// Four weapon tiers plus fists. Each weapon tracks its magazine and
// reserve ammo; 1-4 switch slots, ammo is bought at Solmar Arms (G).
// Shotgun fires a 5-pellet spread; rifle and SMG support holding fire.
import { WEAPONS } from './config.js';

export class Weapons {
  constructor() {
    this.slot = 1; // start with the Pistol
    this.owned = { 1: true };
    // ammo[slot] = { mag, reserve }
    this.ammo = {
      1: { mag: 12, reserve: 36 },
      2: { mag: 0, reserve: 0 },
      3: { mag: 0, reserve: 0 },
      4: { mag: 0, reserve: 0 },
    };
  }
  current() { return WEAPONS[this.slot]; }
  name() { return this.current().name; }
  ammoText() {
    const w = this.current();
    if (w.id === 0) return '—';
    const a = this.ammo[w.id];
    return a.mag + ' / ' + a.reserve;
  }
  canFire() {
    const w = this.current();
    if (w.id === 0) return true;
    return this.ammo[w.id].mag > 0;
  }
  consume() {
    const w = this.current();
    if (w.id === 0) return;
    this.ammo[w.id].mag -= 1;
  }
  reload() {
    const w = this.current();
    if (w.id === 0) return false;
    const a = this.ammo[w.id];
    if (a.mag >= w.mag || a.reserve <= 0) return false;
    const need = w.mag - a.mag;
    const take = Math.min(need, a.reserve);
    a.mag += take; a.reserve -= take;
    return true;
  }
  switchTo(slot) {
    if (slot === 0 || this.owned[slot]) { this.slot = slot; return true; }
    return false;
  }
  buy(slot) {
    const w = WEAPONS[slot];
    if (this.owned[slot]) return 'owned';
    this.owned[slot] = true;
    this.ammo[slot] = { mag: w.mag, reserve: w.mag };
    return 'bought';
  }
  buyAmmo(slot, amount) {
    if (!this.owned[slot]) return false;
    this.ammo[slot].reserve += amount;
    return true;
  }
  serialize() {
    return { slot: this.slot, owned: this.owned, ammo: this.ammo };
  }
  restore(s) {
    if (!s) return;
    this.slot = s.slot ?? 1;
    this.owned = s.owned ?? { 1: true };
    this.ammo = s.ammo ?? this.ammo;
  }
}
