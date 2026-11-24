// SOLMAR HEAT II — player.js
// Jax Moreno on foot (WASD relative to camera, Shift to run, walk-cycle
// animation, building colliders) and behind the wheel (arcade handling
// delegated to the car). Tracks health, armor (absorbs damage first),
// money, respect and the owned-car list.
import { CFG, respectRank, RESPECT_RANKS } from './config.js';
import { clamp } from './random.js';
import { makePersonMesh } from './people.js';
import { RNG } from './random.js';

export class Player {
  constructor(scene) {
    this.mesh = makePersonMesh(new RNG(7), 0xffc233);
    this.mesh.scale.setScalar(1.05);
    scene.add(this.mesh);
    this.x = 0; this.z = 8; this.angle = 0;
    this.health = CFG.playerHealth;
    this.armor = 0;
    this.money = CFG.startMoney;
    this.respect = 0;
    this.car = null;
    this.walkPhase = 0;
    this.speed = 0;
    this.ownedCars = []; // garage catalogue ids
  }
  get rank() { return respectRank(this.respect); }
  get rankName() { return RESPECT_RANKS[this.rank].name; }
  get pos() { return { x: this.x, z: this.z }; }
  enterCar(car) {
    this.car = car; car.stolen = true; car.parked = false;
    this.mesh.visible = false;
  }
  exitCar() {
    if (!this.car) return;
    const c = this.car; this.car = null;
    this.x = c.x + Math.sin(c.angle + Math.PI / 2) * 3;
    this.z = c.z + Math.cos(c.angle + Math.PI / 2) * 3;
    this.mesh.visible = true;
    this.mesh.position.set(this.x, 0, this.z);
  }
  hurt(amount) {
    let left = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, left);
      this.armor -= absorbed; left -= absorbed;
    }
    this.health = Math.max(0, this.health - left);
    return this.health <= 0;
  }
  heal(amount) { this.health = Math.min(CFG.playerHealth, this.health + amount); }
  addRespect(n) { this.respect += n; }
  update(dt, input, colliders) {
    if (this.car) {
      const throttle = (input.forward ? 1 : 0) - (input.back ? 0.7 : 0);
      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      this.car.drive(dt, throttle, steer, input.handbrake);
      this.x = this.car.x; this.z = this.car.z; this.angle = this.car.angle;
      this.speed = Math.abs(this.car.speed);
      return;
    }
    const run = input.run ? CFG.runSpeed : CFG.walkSpeed;
    let mx = 0, mz = 0;
    if (input.forward) mz -= 1;
    if (input.back) mz += 1;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    const len = Math.hypot(mx, mz) || 1;
    mx /= len; mz /= len;
    const camA = input.camAngle || 0;
    const dx = mx * Math.cos(camA) - mz * Math.sin(camA);
    const dz = mx * Math.sin(camA) + mz * Math.cos(camA);
    const moving = Math.abs(mx) + Math.abs(mz) > 0.1;
    this.speed = moving ? run : 0;
    if (moving) {
      this.x += dx * run * dt;
      this.z += dz * run * dt;
      this.angle = Math.atan2(dx, dz);
      this.walkPhase += dt * run * 1.6;
    }
    this.x = clamp(this.x, -210, 210);
    this.z = clamp(this.z, -210, 240);
    for (const c of colliders) {
      const d = Math.hypot(this.x - c.x, this.z - c.z);
      if (d < c.r && d > 0.001) {
        this.x = c.x + (this.x - c.x) / d * c.r;
        this.z = c.z + (this.z - c.z) / d * c.r;
      }
    }
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.angle;
    const s = moving ? Math.sin(this.walkPhase) * 0.55 : 0;
    this.mesh.userData.legL.rotation.x = s;
    this.mesh.userData.legR.rotation.x = -s;
    this.mesh.userData.armL.rotation.x = -s * 0.7;
    this.mesh.userData.armR.rotation.x = s * 0.7;
  }
}
