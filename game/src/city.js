// SOLMAR HEAT II — city.js
// Builds Solmar City: an 11x11-block sun-soaked coastal grid with towers
// (lit windows), palm-lined roads, a central plaza with fountain, beach
// and ocean to the south, a pier, and named landmarks: Casino Sol, Club
// Neon, Marisol's Garage, Solmar Arms gun shop, Kane Warehouse and the
// street-race start line. Seeded RNG keeps the layout deterministic.
import * as THREE from 'three';
import { CFG } from './config.js';
import { RNG } from './random.js';

export function makeBox(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function buildCity(scene, seed = 1) {
  const rng = new RNG(seed);
  const group = new THREE.Group();
  const colliders = [];
  const C = CFG.colors;
  const half = CFG.cityHalf;
  const step = CFG.step;

  // Ground, beach and sea (sea to the south, +Z).
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 160, half * 2 + 200), new THREE.MeshLambertMaterial({ color: 0x6a7a5a }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = 30; ground.receiveShadow = true;
  group.add(ground);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 160, 110), new THREE.MeshLambertMaterial({ color: C.sea }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.1, CFG.seaZ + 40); group.add(sea);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 160, 24), new THREE.MeshLambertMaterial({ color: C.sand }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.15, CFG.beachZ + 6); sand.receiveShadow = true; group.add(sand);

  // Roads: one vertical and one horizontal per grid line.
  const roadMat = new THREE.MeshLambertMaterial({ color: C.road });
  const walkMat = new THREE.MeshLambertMaterial({ color: C.sidewalk });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8d8c8 });
  for (let i = -5; i <= 5; i++) {
    const p = i * step;
    const rv = new THREE.Mesh(new THREE.PlaneGeometry(CFG.roadWidth, half * 2), roadMat);
    rv.rotation.x = -Math.PI / 2; rv.position.set(p, 0.05, 0); rv.receiveShadow = true; group.add(rv);
    const rh = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, CFG.roadWidth), roadMat);
    rh.rotation.x = -Math.PI / 2; rh.position.set(0, 0.05, p); rh.receiveShadow = true; group.add(rh);
    // Centre dashes along each road.
    for (let d = -200; d <= 200; d += 16) {
      const dv = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3), dashMat);
      dv.rotation.x = -Math.PI / 2; dv.position.set(p, 0.07, d); group.add(dv);
      const dh = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), dashMat);
      dh.rotation.x = -Math.PI / 2; dh.position.set(d, 0.07, p); group.add(dh);
    }
  }

  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x2a3542 });
  function tower(x, z, w, d, h, color) {
    const b = makeBox(w, h, d, color, x, h / 2, z);
    group.add(b);
    colliders.push({ x, z, r: Math.max(w, d) * 0.62 });
    const floors = Math.floor(h / 7);
    for (let f = 0; f < floors; f++) {
      for (let k = 0; k < Math.max(2, Math.floor(w / 6)); k++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), rng.chance(0.55) ? windowMat : darkMat);
        win.position.set(x - w / 2 + 3 + k * 6, 4 + f * 7, z + d / 2 + 0.06);
        group.add(win);
      }
    }
    return b;
  }

  // City blocks: skip the central plaza block and the beach row.
  const landmarks = {};
  for (let gx = -5; gx <= 5; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      if (gx === 0 && gz === 0) continue; // plaza
      if (gz === 5) continue; // beach row
      const cx = gx * step + step / 2 - CFG.roadWidth / 2;
      const cz = gz * step + step / 2 - CFG.roadWidth / 2;
      const h = rng.range(10, 52);
      tower(cx, cz, rng.range(15, 23), rng.range(15, 23), h, rng.color(C.building));
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(CFG.blockSize, CFG.blockSize), walkMat);
      walk.rotation.x = -Math.PI / 2; walk.position.set(cx, 0.04, cz); walk.receiveShadow = true;
      group.add(walk);
    }
  }

  // Central plaza + fountain.
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 1.2, 24), new THREE.MeshLambertMaterial({ color: 0xcfc4a8 }));
  plaza.position.set(0, 0.6, 0); group.add(plaza);
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 2.4, 20), new THREE.MeshLambertMaterial({ color: 0x7fb8d8 }));
  fountain.position.set(0, 1.6, 0); group.add(fountain);
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.2, 5, 10), new THREE.MeshBasicMaterial({ color: 0xbfe8ff }));
  jet.position.set(0, 5, 0); group.add(jet);

  function sign(text, color, x, y, z, w = 26, ry = 0) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = color; ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 52);
    const tex = new THREE.CanvasTexture(cv);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, 5), new THREE.MeshBasicMaterial({ map: tex }));
    mesh.position.set(x, y, z); mesh.rotation.y = ry; group.add(mesh);
    return mesh;
  }

  // Named landmarks (block centres on the 40-step grid).
  tower(-80, -80, 30, 22, 20, 0x3a2a4a);
  landmarks.club = new THREE.Vector3(-80, 0, -80);
  sign('CLUB NEON', '#ff2e88', -80, 24, -68.8);
  tower(80, -80, 34, 24, 28, 0xd8b25a);
  landmarks.casino = new THREE.Vector3(80, 0, -80);
  sign('CASINO SOL', '#ffc233', 80, 32, -67.8);
  tower(-80, 80, 28, 20, 12, 0x4a6a8a);
  landmarks.garage = new THREE.Vector3(-80, 0, 80);
  sign("MARISOL'S GARAGE", '#00e5ff', -80, 16, 91.8, 30);
  tower(80, 80, 28, 20, 12, 0x3a5a3a);
  landmarks.gunshop = new THREE.Vector3(80, 0, 80);
  sign('SOLMAR ARMS', '#7dff9a', 80, 16, 91.8);
  tower(160, 160, 30, 22, 14, 0x8a4a3a);
  landmarks.warehouse = new THREE.Vector3(160, 0, 160);
  sign('KANE WAREHOUSE', '#ff5544', 160, 18, 171.8);
  landmarks.pier = new THREE.Vector3(0, 0, 196);
  landmarks.plaza = new THREE.Vector3(0, 0, 0);
  landmarks.race = new THREE.Vector3(0, 0, 180);
  landmarks.beach = new THREE.Vector3(-120, 0, 196);

  // Pier deck + posts reaching into the sea.
  const pierDeck = makeBox(360, 1, 8, 0x8a6a4a, 0, 0.8, CFG.seaZ + 6);
  group.add(pierDeck);
  for (let x = -170; x <= 170; x += 24) {
    group.add(makeBox(3, 1, 26, 0x8a6a4a, x, 0.8, CFG.beachZ + 24));
  }
  // Race start gantry on the beach road.
  const gantryL = makeBox(1.2, 7, 1.2, 0xffc233, -6, 3.5, 180);
  const gantryR = makeBox(1.2, 7, 1.2, 0xffc233, 6, 3.5, 180);
  const gantryT = makeBox(13.2, 1.4, 1.2, 0xff2e88, 0, 7, 180);
  group.add(gantryL); group.add(gantryR); group.add(gantryT);
  sign('RACE START', '#ffffff', 0, 10.5, 180, 14);

  // Palm trees along the roads.
  const palmTrunk = new THREE.MeshLambertMaterial({ color: 0x7a5a34 });
  const palmLeaf = new THREE.MeshLambertMaterial({ color: 0x2e8b4a });
  for (let i = 0; i < 64; i++) {
    const x = rng.range(-half, half);
    const z = rng.pick([-200, -160, -120, -80, -40, 0, 40, 80, 120, 160, 200]) + rng.range(-4, 4);
    if (Math.abs(z) > 205) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 6), palmTrunk);
    trunk.position.set(x, 3.5, z); trunk.castShadow = true; group.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), palmLeaf);
    top.scale.y = 0.45; top.position.set(x, 7.4, z); group.add(top);
  }

  // Street lamps.
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (let i = -5; i <= 5; i++) {
    for (const z of [-160, -80, 0, 80, 160]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      pole.position.set(i * step + 7, 3.5, z); group.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), lampMat);
      bulb.position.set(i * step + 7, 7.2, z); group.add(bulb);
    }
  }

  scene.add(group);
  return { group, colliders, landmarks, rng };
}
