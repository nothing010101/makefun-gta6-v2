// SOLMAR HEAT II — missions.js
// Ten sequential story missions for Jax Moreno vs Kane Rooker, each with
// a name, fixer dialogue, objective type, cash reward and respect.
// Types: goto (reach a landmark), steal-sport, escape (lose the heat),
// shootout (clear the gangsters), race (finish a street race), chain
// (two stops in order), heist (shootout then escape to the garage),
// boss (Kane himself, then the pier). A gold marker + light beacon and
// the minimap blip always point at the current objective.
import * as THREE from 'three';

export const MISSION_DEFS = [
  { id: 1, title: 'Paket untuk Marisol', brief: 'Antar paket ke Marisol\'s Garage.', target: 'garage', type: 'goto', reward: 400, respect: 10, text: 'Marisol: "Jax, kau kembali. Antar paket ini, jangan dibuka."' },
  { id: 2, title: 'Curi Comet GT', brief: 'Curi mobil sport merah yang terparkir, lalu bawa ke garasi.', target: 'sport', type: 'steal-sport', reward: 900, respect: 20, text: 'Marisol: "Kane punya Comet GT di jalanan. Ambil. Itu milik kita sekarang."' },
  { id: 3, title: 'Kabur dari SBPD', brief: 'Polisi mengejar! Hilangkan wanted level sampai 0 bintang.', target: 'escape', type: 'escape', reward: 1500, respect: 25, text: 'Marisol: "Mereka tahu kau di sini. Lari, Jax! Jangan sampai tertangkap!"' },
  { id: 4, title: 'Uang Casino Sol', brief: 'Masuk Casino Sol dan habisi 4 penjaga Kane, lalu ambil tas uangnya.', target: 'casino', type: 'shootout', enemies: 4, reward: 2500, respect: 30, text: 'Marisol: "Kane menyimpan uang kotor di Casino Sol. Ambil kembali milik kita."' },
  { id: 5, title: 'Balapan Pantai', brief: 'Ke garis start balapan di pantai (RACE START) dan menangkan balapannya.', target: 'race', type: 'race', race: 0, reward: 2000, respect: 25, text: 'Marisol: "Tunjukkan pada kota siapa sopir tercepat Solmar."' },
  { id: 6, title: 'Sabotase Gudang Kane', brief: 'Serbu gudang Kane di timur dan habisi 4 anak buahnya.', target: 'warehouse', type: 'shootout', enemies: 4, reward: 4000, respect: 35, text: 'Marisol: "Gudang Kane adalah jantung sindikatnya. Hancurkan operasinya."' },
  { id: 7, title: 'Antar Marisol', brief: 'Antar Marisol: Club Neon dulu, lalu ke dermaga. Jangan sampai ketahuan.', target: 'chain', type: 'chain', chain: ['club', 'pier'], reward: 3000, respect: 30, text: 'Marisol: "Aku ikut, Jax. Club Neon dulu, lalu dermaga. Pelan-pelan saja."' },
  { id: 8, title: 'Perampokan Casino', brief: 'Rampok Casino Sol: habisi 5 penjaga, ambil uangnya, kabur ke garasi.', target: 'heist', type: 'heist', enemies: 5, reward: 6000, respect: 45, text: 'Rico: "Lima penjaga, satu brankas. Aku yang jaga pintu — kau yang ambil uangnya."' },
  { id: 9, title: 'Grand Solmar', brief: 'Balapan besar kota: ke garis start dan menangkan Grand Solmar.', target: 'race', type: 'race', race: 2, reward: 5000, respect: 40, text: 'Marisol: "Seluruh kota menonton, Jax. Menang, dan namamu jadi legenda."' },
  { id: 10, title: 'Akhir Kane', brief: 'Serbu gudang Kane, kalahkan Kane Rooker, lalu kabur ke dermaga.', target: 'boss', type: 'boss', enemies: 6, reward: 10000, respect: 60, text: 'Marisol: "Ini dia, Jax. Kane ada di gudang. Setelah ini kita bebas."' },
];

export class Missions {
  constructor(scene, landmarks, enemies) {
    this.scene = scene;
    this.landmarks = landmarks;
    this.enemies = enemies;
    this.index = 0;
    this.done = false;
    this.chainStep = 0;
    this.phase = 'go'; // heist/boss phases: 'fight' -> 'escape'
    this.escapedTimer = 0;
    this.hadWanted = false;
    this.spawned = false;
    this.marker = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.4, 20),
      new THREE.MeshBasicMaterial({ color: 0xffc233, transparent: true, opacity: 0.8 }),
    );
    this.marker.position.y = 0.3;
    scene.add(this.marker);
    this.beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc233, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    );
    this.beacon.position.y = 20;
    scene.add(this.beacon);
    this.targetPos = null;
    this.setTarget();
  }
  current() { return MISSION_DEFS[this.index] || null; }
  setTarget() {
    const m = this.current();
    this.spawned = false;
    this.phase = 'go';
    this.chainStep = 0;
    if (!m) { this.marker.visible = false; this.beacon.visible = false; this.targetPos = null; return; }
    if (m.type === 'steal-sport' || m.type === 'escape') { this.targetPos = null; this.marker.visible = false; this.beacon.visible = false; return; }
    if (m.type === 'chain') {
      const p = this.landmarks[m.chain[0]];
      this.targetPos = p;
    } else {
      const p = this.landmarks[m.target === 'heist' ? 'casino' : m.target === 'boss' ? 'warehouse' : m.target];
      this.targetPos = p || null;
    }
    if (this.targetPos) {
      this.marker.position.set(this.targetPos.x, 0.3, this.targetPos.z);
      this.beacon.position.set(this.targetPos.x, 20, this.targetPos.z);
      this.marker.visible = true; this.beacon.visible = true;
    }
  }
  complete(player, onDone) {
    const m = this.current();
    if (!m) return;
    player.money += m.reward;
    player.addRespect(m.respect);
    this.index += 1;
    if (this.index >= MISSION_DEFS.length) {
      this.done = true;
      this.marker.visible = false; this.beacon.visible = false;
      this.targetPos = null;
    } else this.setTarget();
    if (onDone) onDone(m);
  }
  _spawnFight(m) {
    if (this.spawned) return;
    this.spawned = true;
    const p = this.landmarks[m.target === 'boss' ? 'warehouse' : m.target === 'heist' ? 'casino' : m.target];
    const boss = m.type === 'boss';
    this.enemies.spawn(p.x, p.z, m.enemies || 4, boss ? 8 : 3, false);
    if (boss) this.enemies.spawn(p.x + 6, p.z + 6, 1, 12, true);
  }
  update(dt, player, police, traffic, races, onComplete) {
    const m = this.current();
    if (!m || this.done) return;
    this.marker.rotation.y += dt;
    this.beacon.rotation.y += dt * 0.5;
    if (m.type === 'steal-sport') {
      if (player.car && player.car.sport) {
        const g = this.landmarks.garage;
        if (Math.hypot(player.x - g.x, player.z - g.z) < 9) this.complete(player, onComplete);
        else {
          this.targetPos = g;
          this.marker.position.set(g.x, 0.3, g.z);
          this.beacon.position.set(g.x, 20, g.z);
          this.marker.visible = true; this.beacon.visible = true;
        }
      }
      return;
    }
    if (m.type === 'escape') {
      if (police.wanted >= 2) { this.hadWanted = true; this.escapedTimer = 0; }
      if (this.hadWanted && police.wanted === 0) {
        this.escapedTimer += dt;
        if (this.escapedTimer > 2) { this.complete(player, onComplete); this.escapedTimer = 0; return; }
      }
      return;
    }
    if (m.type === 'race') {
      if (races.active) return; // race in progress; race system completes it
      if (races.lastResult === 'won' && races.lastRace === m.race) {
        races.lastResult = null;
        this.complete(player, onComplete);
      }
      return;
    }
    if (m.type === 'shootout') {
      if (!this.spawned && this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 26) {
        this._spawnFight(m);
      }
      if (this.spawned && this.enemies.alive() === 0) this.complete(player, onComplete);
      return;
    }
    if (m.type === 'heist') {
      if (this.phase === 'go') {
        if (!this.spawned && this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 26) {
          this._spawnFight(m);
          this.phase = 'fight';
        }
      } else if (this.phase === 'fight') {
        if (this.enemies.alive() === 0) {
          this.phase = 'escape';
          const g = this.landmarks.garage;
          this.targetPos = g;
          this.marker.position.set(g.x, 0.3, g.z);
          this.beacon.position.set(g.x, 20, g.z);
        }
      } else if (this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 7) {
        this.complete(player, onComplete);
      }
      return;
    }
    if (m.type === 'boss') {
      if (this.phase === 'go') {
        if (!this.spawned && this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 26) {
          this._spawnFight(m);
          this.phase = 'fight';
        }
      } else if (this.phase === 'fight') {
        if (this.enemies.alive() === 0) {
          this.phase = 'escape';
          const p = this.landmarks.pier;
          this.targetPos = p;
          this.marker.position.set(p.x, 0.3, p.z);
          this.beacon.position.set(p.x, 20, p.z);
        }
      } else if (this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 8) {
        this.complete(player, onComplete);
      }
      return;
    }
    if (m.type === 'chain') {
      if (this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 7) {
        this.chainStep += 1;
        if (this.chainStep >= m.chain.length) { this.complete(player, onComplete); return; }
        const p = this.landmarks[m.chain[this.chainStep]];
        this.targetPos = p;
        this.marker.position.set(p.x, 0.3, p.z);
        this.beacon.position.set(p.x, 20, p.z);
      }
      return;
    }
    // Plain goto.
    if (this.targetPos && Math.hypot(player.x - this.targetPos.x, player.z - this.targetPos.z) < 7) {
      this.complete(player, onComplete);
    }
  }
}
