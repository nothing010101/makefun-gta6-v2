// SOLMAR HEAT II — vehicles.js
// Cars: mesh builder, arcade driving model (accel, steering, handbrake,
// per-car top speed from the garage catalogue), AI traffic that follows
// the road grid, and parked cars the player can steal (one of them a
// sport car for the steal mission).
import * as THREE from 'three';
import { CFG } from './config.js';
import { RNG, clamp } from './random.js';

const CAR_COLORS = [0xd23b3b, 0x2a6ad2, 0xe8c33a, 0xeeeeee, 0x222222, 0x2ad27a, 0xff7a2a, 0x8a2ad2];

export function makeCarMesh(color, sport = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.75, sport ? 4.6 : 4.2), bodyMat);
  body.position.y = 0.65; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.1), new THREE.MeshLambertMaterial({ color: 0x1a2a3a }));
  cabin.position.set(0, 1.3, -0.2); cabin.castShadow = true; g.add(cabin);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  for (const [x, z] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z); g.add(w);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2aa });
  for (const x of [-0.6, 0.6]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), lightMat);
    l.position.set(x, 0.7, 2.12); g.add(l);
  }
  return g;
}

export class Car {
  constructor(mesh, x, z, angle, sport = false, topSpeed = CFG.carMaxSpeed, accel = CFG.carAccel) {
    this.mesh = mesh; this.x = x; this.z = z; this.angle = angle;
    this.speed = 0; this.sport = sport; this.stolen = false; this.parked = false;
    this.topSpeed = topSpeed; this.accel = accel; this.health = 100;
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = angle;
  }
  drive(dt, throttle, steer, handbrake) {
    this.speed += throttle * this.accel * dt;
    if (handbrake) this.speed *= Math.max(0, 1 - 3 * dt);
    this.speed = clamp(this.speed, -10, this.topSpeed);
    if (Math.abs(throttle) < 0.05) this.speed *= Math.max(0, 1 - 0.8 * dt);
    this.angle += steer * CFG.carTurn * dt * clamp(Math.abs(this.speed) / 8, 0, 1) * Math.sign(this.speed || 1);
    this.x += Math.sin(this.angle) * this.speed * dt;
    this.z += Math.cos(this.angle) * this.speed * dt;
    this.x = clamp(this.x, -210, 210);
    this.z = clamp(this.z, -210, 235);
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.angle;
    this.mesh.rotation.z = -steer * 0.03 * clamp(Math.abs(this.speed) / 20, 0, 1);
  }
}

export class Traffic {
  constructor(scene, seed = 3) {
    this.scene = scene;
    this.rng = new RNG(seed);
    this.cars = [];
    this.parked = [];
    const step = CFG.step;
    const lanes = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    for (let i = 0; i < CFG.trafficCount; i++) {
      const lane = this.rng.pick(lanes) * step;
      const alongRoad = this.rng.chance(0.5);
      const x = alongRoad ? lane : this.rng.range(-190, 190);
      const z = alongRoad ? this.rng.range(-190, 190) : lane;
      const angle = alongRoad ? (this.rng.chance(0.5) ? 0 : Math.PI) : (this.rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2);
      const mesh = makeCarMesh(this.rng.pick(CAR_COLORS), this.rng.chance(0.2));
      scene.add(mesh);
      const car = new Car(mesh, x, z, angle);
      car.speed = this.rng.range(8, 15);
      this.cars.push(car);
    }
    // Parked cars along the roads; the first is the red sport car.
    for (let i = 0; i < CFG.parkedCount; i++) {
      const sport = i === 0;
      const mesh = makeCarMesh(sport ? 0xd23b3b : this.rng.pick(CAR_COLORS), sport);
      const lane = this.rng.pick(lanes) * step + (this.rng.chance(0.5) ? 4 : -4);
      const along = this.rng.range(-180, 180);
      const x = this.rng.chance(0.5) ? lane : along;
      const z = this.rng.chance(0.5) ? lane : along;
      scene.add(mesh);
      const car = new Car(mesh, x, z, this.rng.range(0, Math.PI * 2), sport, sport ? 56 : 44, sport ? 30 : 24);
      car.parked = true;
      this.parked.push(car);
    }
  }
  nearestParked(x, z, maxDist = 7) {
    let best = null; let bd = maxDist;
    for (const c of this.parked) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  nearestTraffic(x, z, maxDist = 7) {
    let best = null; let bd = maxDist;
    for (const c of this.cars) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  addCar(car) { this.cars.push(car); }
  update(dt) {
    for (const c of this.cars) {
      c.x += Math.sin(c.angle) * c.speed * dt;
      c.z += Math.cos(c.angle) * c.speed * dt;
      if (c.x > 210) c.x = -210; if (c.x < -210) c.x = 210;
      if (c.z > 210) c.z = -210; if (c.z < -210) c.z = 210;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.angle;
    }
  }
}
