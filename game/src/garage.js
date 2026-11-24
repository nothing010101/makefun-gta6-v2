// SOLMAR HEAT II — garage.js
// Marisol's Garage shop (press G near the garage) and the Solmar Arms
// gun shop (press G near the gun shop). Buying a car spawns it beside
// the garage and adds it to the player's owned list; repair fixes the
// current car's health. Respect rank gates the faster garage cars.
// The shop UI is a DOM panel; the game pauses while it is open.
import { GARAGE_CARS, WEAPONS, RESPECT_RANKS } from './config.js';
import { makeCarMesh, Car } from './vehicles.js';
import { dist2D } from './random.js';

export class Garage {
  constructor(scene, landmarks, traffic) {
    this.scene = scene;
    this.landmarks = landmarks;
    this.traffic = traffic;
    this.panel = document.getElementById('shop-panel');
    this.titleEl = document.getElementById('shop-title');
    this.listEl = document.getElementById('shop-list');
    this.closeBtn = document.getElementById('shop-close');
    this.open = false;
    this.kind = null; // 'garage' | 'gunshop'
    this.onBuy = null;
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.hide());
  }
  near(player) {
    if (dist2D(player.x, player.z, this.landmarks.garage.x, this.landmarks.garage.z) < 12) return 'garage';
    if (dist2D(player.x, player.z, this.landmarks.gunshop.x, this.landmarks.gunshop.z) < 12) return 'gunshop';
    return null;
  }
  show(kind, player, weapons) {
    this.open = true;
    this.kind = kind;
    if (this.panel) this.panel.style.display = 'block';
    if (this.titleEl) this.titleEl.textContent = kind === 'garage' ? "MARISOL'S GARAGE — Beli Mobil" : 'SOLMAR ARMS — Senjata & Amunisi';
    this._render(player, weapons);
  }
  hide() {
    this.open = false;
    if (this.panel) this.panel.style.display = 'none';
  }
  _row(text, price, disabled, cb) {
    const div = document.createElement('div');
    div.className = 'shop-row';
    const span = document.createElement('span');
    span.textContent = text;
    const btn = document.createElement('button');
    btn.textContent = '$' + price;
    btn.disabled = !!disabled;
    btn.addEventListener('click', () => { cb(); });
    div.appendChild(span);
    div.appendChild(btn);
    this.listEl.appendChild(div);
  }
  _render(player, weapons) {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    const moneyEl = document.createElement('div');
    moneyEl.className = 'shop-money';
    moneyEl.textContent = 'Uang: $' + Math.floor(player.money) + '  ·  Rank: ' + player.rankName;
    this.listEl.appendChild(moneyEl);
    if (this.kind === 'garage') {
      for (const c of GARAGE_CARS) {
        const owned = player.ownedCars.includes(c.id);
        const gated = player.rank < c.rank;
        this._row(
          c.name + ' — top ' + c.topSpeed * 3.6 + ' km/h' + (owned ? ' (MILIKMU)' : gated ? ' (butuh rank ' + RESPECT_RANKS[c.rank].name + ')' : ''),
          c.price, owned || gated || player.money < c.price,
          () => this._buyCar(c, player),
        );
      }
      this._row('Perbaiki mobil ($150)', 150, !player.car || player.money < 150 || player.car.health >= 100, () => {
        player.money -= 150;
        if (player.car) player.car.health = 100;
        if (this.onBuy) this.onBuy('Mobil diperbaiki penuh.');
        this._render(player, weapons);
      });
    } else {
      for (let s = 1; s <= 4; s++) {
        const w = WEAPONS[s];
        const owned = !!weapons.owned[s];
        this._row(
          w.name + (owned ? ' (MILIKMU) — amunisi +' + w.mag : ''),
          owned ? w.ammoPrice : w.price,
          player.money < (owned ? w.ammoPrice : w.price),
          () => {
            if (!owned) {
              player.money -= w.price;
              weapons.buy(s);
              if (this.onBuy) this.onBuy(w.name + ' dibeli!');
            } else {
              player.money -= w.ammoPrice;
              weapons.buyAmmo(s, w.mag);
              if (this.onBuy) this.onBuy('Amunisi ' + w.name + ' +' + w.mag + '.');
            }
            this._render(player, weapons);
          },
        );
      }
      this._row('Armor 50 ($200)', 200, player.money < 200 || player.armor >= 50, () => {
        player.money -= 200;
        player.armor = 50;
        if (this.onBuy) this.onBuy('Armor dipasang (50).');
        this._render(player, weapons);
      });
    }
  }
  _buyCar(c, player) {
    player.money -= c.price;
    player.ownedCars.push(c.id);
    const g = this.landmarks.garage;
    const mesh = makeCarMesh(c.color, true);
    const x = g.x + 14, z = g.z + 6;
    this.scene.add(mesh);
    const car = new Car(mesh, x, z, 0, true, c.topSpeed, c.accel);
    car.parked = true;
    this.traffic.parked.push(car);
    if (this.onBuy) this.onBuy(c.name + ' dibeli! Mobil terparkir di samping garasi.');
    this._render(player, null);
  }
}
