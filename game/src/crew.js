// SOLMAR HEAT II — crew.js
// Jax's crew, unlocked through the story:
//   Q — Marisol Vega (unlocked after mission 2): calls in a getaway car
//       that spawns parked right beside Jax.
//   C — Rico Delgado (unlocked after mission 6): a backup shooter who
//       spawns next to Jax and fires at nearby gangsters and police.
// Both have a 30-second call cooldown.
import { makePersonMesh } from './people.js';
import { RNG, dist2D } from './random.js';
import { makeCarMesh, Car } from './vehicles.js';

export class Crew {
  constructor(scene, traffic) {
    this.scene = scene;
    this.traffic = traffic;
    this.rng = new RNG(31);
    this.marisolReady = false;
    this.ricoReady = false;
    this.cooldownQ = 0;
    this.cooldownC = 0;
    this.rico = null; // { mesh, x, z, angle, timer }
  }
  update(dt, player, enemies, police, combat) {
    this.cooldownQ = Math.max(0, this.cooldownQ - dt);
    this.cooldownC = Math.max(0, this.cooldownC - dt);
    if (!this.rico) return;
    this.rico.timer -= dt;
    if (this.rico.timer <= 0) {
      this.scene.remove(this.rico.mesh);
      this.rico = null;
      return;
    }
    // Rico follows Jax and shoots the nearest enemy within 30m.
    const r = this.rico;
    const d = dist2D(r.x, r.z, player.x, player.z);
    if (d > 6) {
      const a = Math.atan2(player.x - r.x, player.z - r.z);
      r.x += Math.sin(a) * 5 * dt;
      r.z += Math.cos(a) * 5 * dt;
      r.angle = a;
    }
    let target = null; let bd = 30;
    if (enemies) {
      for (const e of enemies.list) {
        if (e.dead) continue;
        const dd = dist2D(r.x, r.z, e.x, e.z);
        if (dd < bd) { bd = dd; target = e; }
      }
    }
    if (target && combat) {
      r.angle = Math.atan2(target.x - r.x, target.z - r.z);
      r.shootTimer -= dt;
      if (r.shootTimer <= 0) {
        r.shootTimer = 0.5;
        target.hp -= 1;
        if (target.hp <= 0) { target.dead = true; target.mesh.visible = false; }
        combat.spawnSpark(r.x + Math.sin(r.angle) * 1.6, r.z + Math.cos(r.angle) * 1.6, 0xfff2aa);
      }
    }
    r.mesh.position.set(r.x, 0, r.z);
    r.mesh.rotation.y = r.angle;
  }
  callMarisol(player) {
    if (!this.marisolReady) return 'Marisol belum bergabung — selesaikan misi 2 dulu.';
    if (this.cooldownQ > 0) return 'Marisol sedang sibuk (' + Math.ceil(this.cooldownQ) + ' dtk).';
    this.cooldownQ = 30;
    const mesh = makeCarMesh(0x00e5ff, true);
    const x = player.x + 6, z = player.z + 6;
    this.scene.add(mesh);
    const car = new Car(mesh, x, z, player.angle, true, 56, 30);
    car.parked = true;
    this.traffic.parked.push(car);
    return 'Marisol: "Getaway car sudah di sampingmu, Jax. Cepat!"';
  }
  callRico(player) {
    if (!this.ricoReady) return 'Rico belum bergabung — selesaikan misi 6 dulu.';
    if (this.cooldownC > 0) return 'Rico sedang sibuk (' + Math.ceil(this.cooldownC) + ' dtk).';
    if (this.rico) return 'Rico sudah bersamamu.';
    this.cooldownC = 30;
    const mesh = makePersonMesh(this.rng, 0x222222);
    mesh.scale.setScalar(1.05);
    const x = player.x + 3, z = player.z + 3;
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);
    this.rico = { mesh, x, z, angle: 0, timer: 45, shootTimer: 0 };
    return 'Rico: "Aku jaga punggungmu, Jax!"';
  }
}
