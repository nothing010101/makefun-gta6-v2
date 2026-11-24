// SOLMAR HEAT II — races.js
// Three checkpoint street races starting at the beach gantry. Press F
// at the start line (or arrive during a race mission) to start; drive
// through the orange checkpoint rings in order against the clock. Win
// the prize, lose nothing but time; best times are saved per race.
import * as THREE from 'three';
import { dist2D } from './random.js';

export const RACE_DEFS = [
  {
    id: 0, name: 'Balapan Pantai', prize: 1200,
    points: [[0, 180], [0, 120], [-80, 120], [-80, 40], [0, 40], [0, 180]],
  },
  {
    id: 1, name: 'Putaran Plaza', prize: 2500,
    points: [[0, 180], [80, 180], [80, 0], [0, 0], [-80, 0], [-80, -80], [0, -80], [0, 180]],
  },
  {
    id: 2, name: 'Grand Solmar', prize: 5000,
    points: [[0, 180], [-120, 180], [-120, -120], [120, -120], [120, 120], [0, 120], [0, 180]],
  },
];

export class Races {
  constructor(scene, landmarks) {
    this.scene = scene;
    this.landmarks = landmarks;
    this.active = false;
    this.race = null;
    this.cp = 0;
    this.time = 0;
    this.best = {}; // race id -> seconds
    this.lastResult = null;
    this.lastRace = -1;
    this.marker = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.5, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xff7a2a }),
    );
    this.marker.rotation.x = Math.PI / 2;
    this.marker.visible = false;
    scene.add(this.marker);
  }
  atStart(player) {
    const s = this.landmarks.race;
    return dist2D(player.x, player.z, s.x, s.z) < 9;
  }
  start(id) {
    const def = RACE_DEFS[id];
    if (!def) return false;
    this.active = true;
    this.race = def;
    this.cp = 1; // point 0 is the start line itself
    this.time = 0;
    this.lastResult = null;
    this.lastRace = id;
    this._placeMarker();
    return true;
  }
  _placeMarker() {
    const p = this.race.points[this.cp];
    if (!p) { this.marker.visible = false; return; }
    this.marker.position.set(p[0], 1.2, p[1]);
    this.marker.visible = true;
  }
  cancel() {
    this.active = false;
    this.race = null;
    this.marker.visible = false;
  }
  update(dt, player, onFinish) {
    if (!this.active || !this.race) return;
    this.time += dt;
    const p = this.race.points[this.cp];
    if (p && dist2D(player.x, player.z, p[0], p[1]) < 7) {
      this.cp += 1;
      if (this.cp >= this.race.points.length) {
        const won = true;
        const t = this.time;
        const prev = this.best[this.race.id];
        if (!prev || t < prev) this.best[this.race.id] = Math.round(t * 100) / 100;
        const prize = this.race.prize;
        const name = this.race.name;
        this.active = false;
        this.marker.visible = false;
        this.lastResult = 'won';
        if (onFinish) onFinish({ name, prize, time: t, best: this.best[this.race.id] });
        return;
      }
      this._placeMarker();
    }
  }
  serialize() { return this.best; }
  restore(b) { if (b) this.best = b; }
}
