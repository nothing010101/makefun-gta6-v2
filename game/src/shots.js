// SOLMAR HEAT II — shots.js
// Deterministic screenshot staging for ?shot=<name>&seed=1. Each shot
// freezes gameplay (game.shotFreeze) so the frame is stable, stages the
// player, police, helicopter, traffic and pedestrians in view, and leaves
// the HUD (minimap, stars, money, objective) visible.
//   1-start  city vista + title menu over the plaza
//   2-chase  car chase: sport car, 3 SBPD units, CONDOR-1 heli, 4 stars
//   3-street on foot by the plaza: traffic + pedestrians, 0 stars
//   4-heist  casino shootout: rifle, 4 gangsters, muzzle flash, 2 stars
import * as THREE from 'three';

export function parseShotParams() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot') || '', seed: parseInt(q.get('seed') || '1', 10) || 1 };
}

export function applyShot(game, shot) {
  if (!shot) return false;
  const cam = game.camera;
  const p = game.player;
  const setCam = (x, y, z, tx, ty, tz) => {
    cam.position.set(x, y, z);
    cam.lookAt(tx, ty, tz);
    game.shotCamera = { x, y, z, tx, ty, tz };
  };
  game.shotFreeze = true;
  if (shot === 'start') {
    game.state = 'menu';
    p.x = 0; p.z = 24; p.mesh.position.set(0, 0, 24);
    setCam(70, 62, 150, 0, 8, 0);
    return true;
  }
  if (shot === 'chase') {
    game.state = 'playing';
    game.police.addCrime(4);
    game.police.frozen = true;
    const c = game.traffic.parked[0];
    if (c && !p.car) p.enterCar(c);
    p.x = 0; p.z = 40;
    if (p.car) {
      p.car.x = 0; p.car.z = 40; p.car.angle = 0; p.car.speed = 0;
      p.car.mesh.children[0].material.color.setHex(0xd23b3b);
      p.car.mesh.position.set(0, 0, 40);
      p.car.mesh.rotation.y = 0;
    }
    // Stage 3 SBPD units around the player car (left-rear, right-rear, ahead).
    while (game.police.units.length < 3) game.police.spawnUnit(p);
    const spots = [[-5, -8], [6, -10], [9, 14]];
    game.police.units.forEach((u, i) => {
      const s = spots[Math.min(i, 2)];
      u.x = p.x + s[0]; u.z = p.z + s[1];
      u.angle = 0; u.speed = 0;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = 0;
    });
    // CONDOR-1 helicopter ahead-left, high in frame, searchlight on.
    const heli = game.police.heli;
    heli.mesh.visible = true;
    heli.x = -14; heli.z = 78;
    heli.mesh.position.set(-14, 26, 78);
    heli.mesh.rotation.y = 0.6;
    // A roadblock further up the road.
    game.police.spawnRoadblock(p);
    game.missions.index = 2;
    game.missions.setTarget();
    setCam(2, 4.5, 27, 0, 2, 46);
    return true;
  }
  if (shot === 'street') {
    game.state = 'playing';
    if (p.car) p.exitCar();
    p.x = 6; p.z = 14; p.angle = Math.PI; p.mesh.position.set(6, 0, 14); p.mesh.rotation.y = Math.PI;
    // A traffic car on the road right beside the player.
    const tc = game.traffic.cars[0];
    if (tc) {
      tc.x = 0; tc.z = 34; tc.angle = 0; tc.speed = 0;
      tc.mesh.position.set(0, 0, 34); tc.mesh.rotation.y = 0;
    }
    const tc2 = game.traffic.cars[1];
    if (tc2) {
      tc2.x = -40; tc2.z = 20; tc2.angle = Math.PI / 2; tc2.speed = 0;
      tc2.mesh.position.set(-40, 0, 20); tc2.mesh.rotation.y = Math.PI / 2;
    }
    // Pedestrians strolling on the plaza sidewalk.
    game.peds.list.forEach((pd, i) => {
      if (i < 5) {
        pd.x = -2 + i * 4; pd.z = 24 + (i % 2) * 4; pd.panic = 0; pd.angle = Math.PI;
        pd.mesh.position.set(pd.x, 0, pd.z); pd.mesh.rotation.y = Math.PI;
      }
    });
    game.missions.index = 0;
    game.missions.setTarget();
    setCam(6, 4.5, 2, 6, 2, 16);
    return true;
  }
  if (shot === 'heist') {
    game.state = 'playing';
    game.police.addCrime(2);
    game.police.frozen = true;
    if (p.car) p.exitCar();
    p.x = 74; p.z = -58; p.angle = 0.6; p.mesh.position.set(74, 0, -58); p.mesh.rotation.y = 0.6;
    game.weapons.buy(4);
    game.weapons.switchTo(4);
    // Four gangsters guarding the casino front.
    game.enemies.spawn(72, -68, 4, 3, false);
    const epos = [[78, -68], [72, -70], [82, -66], [76, -72]];
    game.enemies.list.forEach((e, i) => {
      e.x = epos[i][0]; e.z = epos[i][1];
      e.mesh.position.set(e.x, 0, e.z);
    });
    // Persistent muzzle flash + tracer line so the shootout reads in a still.
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff2aa }));
    flash.position.set(75, 1.5, -56.5);
    game.scene.add(flash);
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      t.position.set(75.9 + i * 0.9, 1.5, -55.2 + i * 1.3);
      game.scene.add(t);
    }
    game.missions.index = 7;
    game.missions.setTarget();
    setCam(78, 8, -40, 80, 8, -72);
    return true;
  }
  return false;
}
