// SOLMAR HEAT II — police.js
// The 5-star SBPD wanted system. Police cars chase and PIT the player;
// at 3+ stars SBPD sets roadblocks ahead of the player; at 4-5 stars the
// CONDOR-1 helicopter circles overhead with a visible searchlight cone.
// Wanted decays slowly, faster when no unit can see the player (hidden).
// Busted: a unit catches Jax on foot. Wasted is handled by health.
import * as THREE from 'three';
import { CFG } from './config.js';
import { RNG, clamp, dist2D } from './random.js';
import { makeCarMesh, Car } from './vehicles.js';

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.rng = new RNG(11);
    this.wanted = 0;
    this.heat = 0;
    this.units = [];
    this.roadblocks = [];
    this.heli = null;
    this.heliAngle = 0;
    this.sirenTime = 0;
    this.frozen = false; // screenshot staging freezes unit positions
    this._buildHeli();
  }
  _buildHeli() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x2244aa }));
    body.position.y = 0; g.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 4.5), new THREE.MeshLambertMaterial({ color: 0x2244aa }));
    tail.position.set(0, 0.2, -4.5); g.add(tail);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.15, 0.5), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    rotor.position.y = 1.0; g.add(rotor);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff2aa }));
    light.position.set(0, -0.9, 2); g.add(light);
    // Searchlight cone pointing down.
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(6, 22, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff2aa, transparent: true, opacity: 0.16, side: THREE.DoubleSide }),
    );
    cone.position.y = -12; cone.rotation.x = Math.PI; g.add(cone);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(5.5, 20), new THREE.MeshBasicMaterial({ color: 0xfff2aa, transparent: true, opacity: 0.25 }));
    spot.rotation.x = -Math.PI / 2; spot.position.y = -22.5; g.add(spot);
    g.visible = false;
    this.scene.add(g);
    this.heli = { mesh: g, rotor, x: 0, z: 0, y: 26 };
  }
  addCrime(amount) {
    this.heat = clamp(this.heat + amount, 0, 5);
    this.wanted = Math.ceil(this.heat);
  }
  update(dt, player, onBusted) {
    if (this.frozen) return;
    // Decay: faster when hidden (no unit within 45m).
    let nearest = 999;
    for (const u of this.units) nearest = Math.min(nearest, dist2D(u.x, u.z, player.x, player.z));
    if (this.wanted > 0) {
      const rate = nearest > 45 ? CFG.hiddenDecay : CFG.wantedDecay;
      this.heat = Math.max(0, this.heat - rate * dt);
    }
    this.wanted = this.heat < 0.5 ? 0 : Math.ceil(this.heat);
    const want = Math.min(this.wanted, CFG.policeMax);
    while (this.units.length < want) this.spawnUnit(player);
    while (this.units.length > want) {
      const u = this.units.pop();
      this.scene.remove(u.mesh);
    }
    this.sirenTime += dt;
    for (const u of this.units) {
      const dx = player.x - u.x, dz = player.z - u.z;
      const d = Math.hypot(dx, dz) || 1;
      const target = Math.atan2(dx, dz);
      let diff = target - u.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      u.angle += clamp(diff, -2.4 * dt, 2.4 * dt);
      u.speed = clamp(u.speed + 16 * dt, 0, 26 + this.wanted * 3.5);
      u.x += Math.sin(u.angle) * u.speed * dt;
      u.z += Math.cos(u.angle) * u.speed * dt;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = u.angle;
      const flash = Math.sin(this.sirenTime * 10) > 0 ? 0xff2222 : 0x2244ff;
      u.light.material.color.setHex(flash);
      // PIT / ram: on foot the player is busted; in a car the hit slows and damages the car.
      if (d < 3.4) {
        if (!player.car) {
          if (onBusted) onBusted();
        } else if (u.speed > 8) {
          player.car.speed *= 0.55;
          player.car.health -= 8;
          u.speed = 0;
        }
      }
    }
    // Roadblocks at 3+ stars: two parked SBPD cars across the road ahead.
    const wantBlocks = this.wanted >= 3 ? 2 : 0;
    while (this.roadblocks.length < wantBlocks) this.spawnRoadblock(player);
    while (this.roadblocks.length > wantBlocks) {
      const r = this.roadblocks.pop();
      this.scene.remove(r.mesh);
    }
    for (const r of this.roadblocks) {
      r.light.material.color.setHex(Math.sin(this.sirenTime * 10) > 0 ? 0xff2222 : 0x2244ff);
      if (dist2D(r.x, r.z, player.x, player.z) < 4 && player.car) {
        player.car.speed *= 0.4;
        player.car.health -= 4;
      }
    }
    // CONDOR-1 helicopter at 4-5 stars.
    const heliOn = this.wanted >= 4;
    this.heli.mesh.visible = heliOn;
    if (heliOn) {
      this.heliAngle += dt * 0.35;
      this.heli.x = player.x + Math.cos(this.heliAngle) * 26;
      this.heli.z = player.z + Math.sin(this.heliAngle) * 26;
      this.heli.mesh.position.set(this.heli.x, this.heli.y, this.heli.z);
      this.heli.mesh.rotation.y = -this.heliAngle;
      this.heli.rotor.rotation.y += dt * 18;
    }
  }
  spawnUnit(player) {
    const mesh = makeCarMesh(0x111111, false);
    const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    light.position.set(0, 1.75, 0); mesh.add(light);
    const a = this.rng.range(0, Math.PI * 2);
    const x = clamp(player.x + Math.sin(a) * 60, -200, 200);
    const z = clamp(player.z + Math.cos(a) * 60, -200, 200);
    this.scene.add(mesh);
    const car = new Car(mesh, x, z, 0);
    car.light = light;
    this.units.push(car);
  }
  spawnRoadblock(player) {
    const mesh = makeCarMesh(0x111111, false);
    const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    light.position.set(0, 1.75, 0); mesh.add(light);
    const fx = Math.sin(player.angle), fz = Math.cos(player.angle);
    const x = clamp(player.x + fx * 55, -200, 200);
    const z = clamp(player.z + fz * 55, -200, 200);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = player.angle + Math.PI / 2;
    this.scene.add(mesh);
    this.roadblocks.push({ mesh, x, z, light });
  }
  clear() {
    for (const u of this.units) this.scene.remove(u.mesh);
    for (const r of this.roadblocks) this.scene.remove(r.mesh);
    this.units = []; this.roadblocks = [];
    this.wanted = 0; this.heat = 0;
    this.heli.mesh.visible = false;
  }
}
