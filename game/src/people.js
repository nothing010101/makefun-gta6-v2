// SOLMAR HEAT II — people.js
// Pedestrians who stroll the sidewalks and panic/flee when crime happens
// nearby, plus Kane's gangsters: armed enemies spawned by shootout and
// heist missions who chase the player and shoot back.
import * as THREE from 'three';
import { CFG } from './config.js';
import { RNG, dist2D } from './random.js';

const SKINS = [0xf2c89b, 0xc98d5a, 0x8a5a34, 0xe8b88a];
const SHIRTS = [0xff6a5a, 0x4a90e2, 0x7ac74f, 0xffd23f, 0x9b59b6, 0xeeeeee, 0x222222];

export function makePersonMesh(rng, shirtColor) {
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: rng.pick(SKINS) });
  const shirt = new THREE.MeshLambertMaterial({ color: shirtColor ?? rng.pick(SHIRTS) });
  const pants = new THREE.MeshLambertMaterial({ color: rng.pick([0x2a3a5a, 0x333333, 0x5a4a3a]) });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), shirt);
  body.position.y = 1.15; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), skin);
  head.position.y = 2.0; head.castShadow = true; g.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.9, 0.32), pants);
  legL.position.set(-0.22, 0.45, 0); g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.22; g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), shirt);
  armL.position.set(-0.6, 1.15, 0); g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.6; g.add(armR);
  g.userData = { legL, legR, armL, armR };
  return g;
}

function walkAnim(p, dt, speed) {
  p.walkPhase += dt * speed * 3;
  const s = Math.sin(p.walkPhase) * 0.5;
  p.mesh.userData.legL.rotation.x = s;
  p.mesh.userData.legR.rotation.x = -s;
  p.mesh.userData.armL.rotation.x = -s * 0.7;
  p.mesh.userData.armR.rotation.x = s * 0.7;
}

export class Pedestrians {
  constructor(scene, seed = 2) {
    this.scene = scene;
    this.rng = new RNG(seed);
    this.list = [];
    for (let i = 0; i < CFG.pedCount; i++) {
      const mesh = makePersonMesh(this.rng);
      const x = this.rng.range(-190, 190);
      const z = this.rng.range(-190, 190);
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      this.list.push({
        mesh, x, z, angle: this.rng.range(0, Math.PI * 2),
        speed: this.rng.range(1.2, 2.4), panic: 0, walkPhase: this.rng.range(0, 6),
      });
    }
  }
  scare(x, z, radius = 18) {
    for (const p of this.list) {
      if (dist2D(p.x, p.z, x, z) < radius) {
        p.panic = 3 + this.rng.range(0, 2);
        p.angle = Math.atan2(p.x - x, p.z - z);
      }
    }
  }
  update(dt, danger) {
    for (const p of this.list) {
      if (danger && dist2D(p.x, p.z, danger.x, danger.z) < 14) p.panic = 2.5;
      const speed = p.panic > 0 ? 6.5 : p.speed;
      if (p.panic > 0) p.panic -= dt;
      p.x += Math.sin(p.angle) * speed * dt;
      p.z += Math.cos(p.angle) * speed * dt;
      if (Math.abs(p.x) > 205 || Math.abs(p.z) > 205) p.angle += Math.PI * 0.7;
      if (this.rng.chance(0.002)) p.angle += this.rng.range(-1.5, 1.5);
      walkAnim(p, dt, speed);
      p.mesh.position.set(p.x, 0, p.z);
      p.mesh.rotation.y = p.angle;
    }
  }
}

// Armed gangsters: hp, slow chase, periodic shots at the player.
export class Enemies {
  constructor(scene) {
    this.scene = scene;
    this.rng = new RNG(21);
    this.list = [];
  }
  spawn(x, z, count, hp = 3, boss = false) {
    for (let i = 0; i < count; i++) {
      const mesh = makePersonMesh(this.rng, boss ? 0x111111 : 0x8a1a1a);
      if (boss) mesh.scale.setScalar(1.25);
      const ex = x + this.rng.range(-8, 8);
      const ez = z + this.rng.range(-8, 8);
      mesh.position.set(ex, 0, ez);
      this.scene.add(mesh);
      this.list.push({
        mesh, x: ex, z: ez, angle: 0, hp, boss,
        shootTimer: this.rng.range(0.8, 2), walkPhase: 0, dead: false,
      });
    }
  }
  alive() { return this.list.filter((e) => !e.dead).length; }
  clear() {
    for (const e of this.list) this.scene.remove(e.mesh);
    this.list = [];
  }
  // Returns damage dealt to the player this frame (0 when nobody hits).
  update(dt, player) {
    let damage = 0;
    for (const e of this.list) {
      if (e.dead) continue;
      const d = dist2D(e.x, e.z, player.x, player.z);
      const target = Math.atan2(player.x - e.x, player.z - e.z);
      e.angle = target;
      if (d > 10) {
        e.x += Math.sin(target) * 3.2 * dt;
        e.z += Math.cos(target) * 3.2 * dt;
        walkAnim(e, dt, 3.2);
      }
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && d < 42) {
        e.shootTimer = e.boss ? 1.1 : 1.9;
        // Enemy fire is inaccurate at range: hit chance falls with distance.
        if (this.rng.chance(Math.max(0.08, 0.5 - d * 0.01))) damage += e.boss ? 12 : 6;
      }
      e.mesh.position.set(e.x, 0, e.z);
      e.mesh.rotation.y = e.angle;
    }
    return damage;
  }
}
