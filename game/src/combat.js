// SOLMAR HEAT II — combat.js
// Shooting and punching. Bullets are visible tracers with a muzzle flash;
// they damage gangsters, police cars (ramming damage is separate) and
// scare pedestrians. Punching is the unarmed fallback and also scares
// nearby pedestrians, which raises the wanted level.
import * as THREE from 'three';
import { dist2D } from './random.js';

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.punchCooldown = 0;
    this.shootCooldown = 0;
  }
  punch(player, peds, police, enemies) {
    if (this.punchCooldown > 0) return false;
    this.punchCooldown = 0.45;
    const fx = player.x + Math.sin(player.angle) * 2.2;
    const fz = player.z + Math.cos(player.angle) * 2.2;
    let hit = false;
    for (const p of peds.list) {
      if (dist2D(p.x, p.z, fx, fz) < 2.4) { p.scare(player.x, player.z, 20); hit = true; }
    }
    if (enemies) {
      for (const e of enemies.list) {
        if (!e.dead && dist2D(e.x, e.z, fx, fz) < 2.4) {
          e.hp -= 1;
          if (e.hp <= 0) { e.dead = true; e.mesh.visible = false; }
          hit = true;
        }
      }
    }
    if (hit && police) police.addCrime(1);
    this.spawnSpark(fx, fz, 0xffe08a);
    return hit;
  }
  // Fire the current weapon. Returns 'fired' | 'empty' | 'cooldown'.
  shoot(player, weapons, police, enemies, peds) {
    if (this.shootCooldown > 0) return 'cooldown';
    const w = weapons.current();
    this.shootCooldown = w.rate;
    if (!weapons.canFire()) {
      if (weapons.reload()) return 'reload';
      return 'empty';
    }
    weapons.consume();
    const pellets = w.spread;
    for (let i = 0; i < pellets; i++) {
      const spreadA = pellets > 1 ? (i - (pellets - 1) / 2) * 0.06 : 0;
      const a = player.angle + spreadA;
      const geo = new THREE.SphereGeometry(0.16, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
      const b = new THREE.Mesh(geo, mat);
      b.position.set(player.x, 1.4, player.z);
      this.scene.add(b);
      this.bullets.push({
        mesh: b, vx: Math.sin(a) * 70, vz: Math.cos(a) * 70,
        life: w.range / 70, dmg: w.dmg, fromPlayer: true,
      });
    }
    this.spawnSpark(player.x + Math.sin(player.angle) * 1.6, player.z + Math.cos(player.angle) * 1.6, 0xfff2aa);
    if (police) police.addCrime(w.id === 4 ? 1.5 : 1);
    if (peds) peds.scare(player.x, player.z, 22);
    this._enemies = enemies;
    return 'fired';
  }
  spawnSpark(x, z, color) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color }));
    s.position.set(x, 1.2, z);
    this.scene.add(s);
    this.bullets.push({ mesh: s, vx: 0, vz: 0, life: 0.16, spark: true });
  }
  // Bullet vs enemy / police-car hits. Returns cash earned from kills.
  update(dt, enemies, police) {
    this.punchCooldown = Math.max(0, this.punchCooldown - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    let earned = 0;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.z += b.vz * dt;
      if (b.spark) { /* spark only */ }
      else if (b.fromPlayer && enemies) {
        for (const e of enemies.list) {
          if (!e.dead && dist2D(b.mesh.position.x, b.mesh.position.z, e.x, e.z) < 1.4) {
            e.hp -= b.dmg;
            if (e.hp <= 0) { e.dead = true; e.mesh.visible = false; earned += 50; }
            b.life = 0;
            break;
          }
        }
      }
      if (b.life <= 0) { this.scene.remove(b.mesh); this.bullets.splice(i, 1); }
    }
    return earned;
  }
}
