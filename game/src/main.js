// SOLMAR HEAT II — main.js
// SOLMAR HEAT II: sun-soaked open-world crime in Solmar City.
//   * 11x11-block coastal city: towers, palms, plaza + fountain, beach,
//     ocean, pier, Casino Sol, Club Neon, garage, gun shop, race start.
//   * On foot (WASD, Shift run, mouse orbit) and driving (arcade handling,
//     Space handbrake, E enter/exit, steal parked cars, carjack traffic).
//   * Traffic on the roads, pedestrians who panic and flee.
//   * 5-star SBPD wanted: police chase + PIT, roadblocks at 3+ stars,
//     CONDOR-1 helicopter with searchlight at 4-5 stars, decay when hidden.
//   * Combat: 4 weapon tiers (Pistol/SMG/Shotgun/Rifle, keys 1-4), ammo,
//     muzzle flash, gun shop; punch when unarmed.
//   * 10 sequential story missions with dialogue, markers, cash + respect.
//   * Garage: 4 cars to buy (respect-gated), repair. 3 checkpoint street
//     races with saved best times. Respect ranks Rookie/Hustler/Wheelman/
//     Kingpin. 3 procedural radio stations (R). Crew: Marisol (Q, getaway
//     car) and Rico (C, backup shooter). Saves to localStorage.
//   * HUD: money, rank, stars, health + armor, speed, weapon/ammo, radio,
//     objective, race timer, LIVE 2D minimap, message feed.
//   * Screens: title, pause, shop, mission banner, busted/wasted game over,
//     all-missions ending. Screenshot mode: ?shot=start|chase|street|heist.
import * as THREE from 'three';
import { CFG, SAVE_KEY } from './config.js';
import { buildCity } from './city.js';
import { Pedestrians, Enemies } from './people.js';
import { Traffic } from './vehicles.js';
import { Player } from './player.js';
import { Police } from './police.js';
import { Combat } from './combat.js';
import { Weapons } from './weapons.js';
import { Missions } from './missions.js';
import { Races } from './races.js';
import { Garage } from './garage.js';
import { Crew } from './crew.js';
import { HUD } from './hud.js';
import { AudioSys } from './audio.js';
import { Radio } from './radio.js';
import { Input } from './input.js';
import { parseShotParams, applyShot } from './shots.js';

const params = parseShotParams();
const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.colors.sky);
scene.fog = new THREE.Fog(CFG.colors.sky, 200, 480);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(30, 30, 86);

const sun = new THREE.DirectionalLight(CFG.colors.sun, 2.4);
sun.position.set(120, 180, 60);
sun.castShadow = true;
sun.shadow.camera.left = -240; sun.shadow.camera.right = 240;
sun.shadow.camera.top = 240; sun.shadow.camera.bottom = -240;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x8a7a5a, 1.1));

const city = buildCity(scene, params.seed);
const peds = new Pedestrians(scene, params.seed + 1);
const enemies = new Enemies(scene);
const traffic = new Traffic(scene, params.seed + 2);
const player = new Player(scene);
const police = new Police(scene);
const combat = new Combat(scene);
const weapons = new Weapons();
const missions = new Missions(scene, city.landmarks, enemies);
const races = new Races(scene, city.landmarks);
const garage = new Garage(scene, city.landmarks, traffic);
const crew = new Crew(scene, traffic);
const hud = new HUD();
const audio = new AudioSys();
const radio = new Radio(audio);
const input = new Input(renderer.domElement);

const game = {
  state: 'menu', scene, camera, city, player, police, missions, traffic,
  peds, enemies, races, weapons, radio, garage, crew,
  chaseShot: false, shotCamera: null, shotFreeze: false, camAngle: 0,
};

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      money: player.money, health: player.health, armor: player.armor,
      respect: player.respect, mission: missions.index,
      x: player.x, z: player.z, wanted: police.wanted,
      weapons: weapons.serialize(), ownedCars: player.ownedCars,
      raceBest: races.serialize(),
      marisol: crew.marisolReady, rico: crew.ricoReady,
    }));
  } catch (e) { /* storage unavailable */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    player.money = s.money ?? CFG.startMoney;
    player.health = s.health ?? CFG.playerHealth;
    player.armor = s.armor ?? 0;
    player.respect = s.respect ?? 0;
    missions.index = s.mission ?? 0;
    missions.setTarget();
    player.x = s.x ?? 0; player.z = s.z ?? 8;
    player.mesh.position.set(player.x, 0, player.z);
    weapons.restore(s.weapons);
    player.ownedCars = s.ownedCars ?? [];
    races.restore(s.raceBest);
    crew.marisolReady = !!s.marisol;
    crew.ricoReady = !!s.rico;
    return true;
  } catch (e) { return false; }
}

function startGame(fresh) {
  audio.init();
  if (fresh) {
    player.money = CFG.startMoney; player.health = CFG.playerHealth; player.armor = 0;
    player.respect = 0; player.ownedCars = [];
    missions.index = 0; missions.done = false; missions.setTarget();
    enemies.clear();
    police.clear();
    races.cancel();
    crew.marisolReady = false; crew.ricoReady = false;
    if (player.car) player.exitCar();
    player.x = 0; player.z = 8;
    player.mesh.position.set(0, 0, 8);
    player.mesh.visible = true;
  }
  game.state = 'playing';
  hud.showMenu(false);
  hud.showGameOver(false);
  hud.showEnding(false);
  const m = missions.current();
  if (m) hud.showMessage(m.text, 6);
}

function gameOver(reason) {
  game.state = 'gameover';
  audio.busted();
  hud.showGameOver(true, reason + ' — Uang $' + Math.floor(player.money) + ' — Misi ' + missions.index + '/10 selesai.');
  saveGame();
}

function onMissionDone(m) {
  audio.missionDone();
  audio.cash();
  hud.showBanner('MISI SELESAI: ' + m.title + ' — Hadiah $' + m.reward + ' + ' + m.respect + ' respect', 5);
  hud.showMessage('MISI SELESAI: ' + m.title + ' — Hadiah $' + m.reward + '!', 5);
  if (m.id === 2) { crew.marisolReady = true; hud.showMessage('Marisol bergabung! Tekan Q untuk panggil getaway car.', 5); }
  if (m.id === 6) { crew.ricoReady = true; hud.showMessage('Rico bergabung! Tekan C untuk panggil backup.', 5); }
  if (missions.done) {
    game.state = 'ending';
    hud.showEnding(true);
  }
  saveGame();
}

input.onAction = (action) => {
  if (game.state !== 'playing' || game.shotFreeze) return;
  audio.init();
  if (action === 'enter') {
    if (player.car) { player.exitCar(); hud.showMessage('Kamu keluar dari mobil.'); }
    else {
      const c = traffic.nearestParked(player.x, player.z, 7) || traffic.nearestTraffic(player.x, player.z, 7);
      if (c) {
        player.enterCar(c);
        police.addCrime(1);
        peds.scare(player.x, player.z, 14);
        hud.showMessage(c.sport ? 'Mobil sport dicuri! SBPD mengejarmu!' : 'Mobil dicuri! Cepat pergi!');
        audio.blip(300, 0.2, 'square', 0.15);
      } else hud.showMessage('Tidak ada mobil di dekat sini. Cari mobil yang terparkir.');
    }
  }
  if (action === 'interact') {
    if (races.atStart(player) && !races.active) {
      const cur = missions.current();
      let id = 0;
      if (cur && cur.type === 'race') id = cur.race;
      else {
        const unfinished = [0, 1, 2].find((i) => !races.best[i]);
        id = unfinished ?? 0;
      }
      races.start(id);
      hud.showMessage('Balapan dimulai: ' + races.race.name + '! Lewati semua checkpoint oranye!', 4);
      return;
    }
    const m = missions.current();
    if (m) hud.showMessage(m.brief, 4);
  }
  if (action === 'attack') {
    if (combat.punch(player, peds, police, enemies)) audio.punch();
  }
  if (action === 'shoot') {
    const res = combat.shoot(player, weapons, police, enemies, peds);
    if (res === 'fired') {
      if (weapons.current().id === 3) audio.shotgun(); else audio.shot();
    } else if (res === 'empty') hud.showMessage('Amunisi habis! Beli di Solmar Arms — tekan G di dekat toko senjata.', 3);
    else if (res === 'reload') hud.showMessage('Reload...', 2);
  }
};
input.onPause = () => {
  if (garage.open) { garage.hide(); if (game.state === 'shop') game.state = 'playing'; return; }
  if (game.state === 'playing') {
    game.state = 'paused'; hud.showMenu(true);
    document.getElementById('menu-title').textContent = 'JEDA — SOLMAR HEAT II';
  } else if (game.state === 'paused') { game.state = 'playing'; hud.showMenu(false); }
};
input.onMute = () => {
  const muted = audio.toggleMute();
  hud.showMessage(muted ? 'Suara dimatikan (M).' : 'Suara dinyalakan (M).', 2);
};
input.onWeapon = (slot) => {
  if (game.state !== 'playing') return;
  if (weapons.switchTo(slot)) hud.showMessage('Senjata: ' + weapons.name() + ' — ' + weapons.ammoText(), 2);
  else hud.showMessage('Senjata belum dibeli — kunjungi Solmar Arms (G).', 3);
};
input.onRadio = () => {
  if (game.state !== 'playing') return;
  const name = radio.next();
  hud.showMessage('Radio: ' + name, 2);
};
input.onCrew = (who) => {
  if (game.state !== 'playing' || game.shotFreeze) return;
  const msg = who === 'marisol' ? crew.callMarisol(player) : crew.callRico(player);
  hud.showMessage(msg, 4);
};
input.onShop = () => {
  if (game.state !== 'playing') return;
  if (garage.open) { garage.hide(); return; }
  const kind = garage.near(player);
  if (kind) {
    garage.show(kind, player, weapons);
    garage.onBuy = (msg) => hud.showMessage(msg, 3);
    game.state = 'shop';
  } else {
    hud.showMessage('Tidak ada toko di sini. Garasi Marisol di barat daya, Solmar Arms di tenggara.', 3);
  }
};
garage.onBuy = (msg) => hud.showMessage(msg, 3);

document.getElementById('btn-start').addEventListener('click', () => startGame(true));
document.getElementById('btn-continue').addEventListener('click', () => {
  const had = loadGame();
  startGame(false);
  hud.showMessage(had ? 'Save dimuat. Selamat datang kembali, Jax.' : 'Tidak ada save. Mulai baru.', 3);
});
document.getElementById('btn-restart').addEventListener('click', () => startGame(true));
document.getElementById('btn-ending-restart').addEventListener('click', () => startGame(true));
document.getElementById('btn-mute').addEventListener('click', () => { audio.init(); input.onMute(); });
document.getElementById('shop-close').addEventListener('click', () => { garage.hide(); if (game.state === 'shop') game.state = 'playing'; });
window.addEventListener('beforeunload', saveGame);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Continue button only when a save exists.
try {
  if (!localStorage.getItem(SAVE_KEY)) {
    const bc = document.getElementById('btn-continue');
    if (bc) bc.style.display = 'none';
  }
} catch (e) { /* ignore */ }

const isShot = applyShot(game, params.shot);
if (isShot && params.shot !== 'start') {
  hud.showMenu(false);
}
if (params.shot === 'chase') hud.showMessage('MISI 3/10 — Kabur dari SBPD: 4 bintang! CONDOR-1 di atasmu!', 8);
if (params.shot === 'heist') hud.showMessage('MISI 8/10 — Perampokan Casino: habisi penjaga Kane!', 8);

const clock = new THREE.Clock();
let camYaw = 0;

function updateCamera(dt) {
  if (game.shotCamera) {
    const sc = game.shotCamera;
    camera.position.set(sc.x, sc.y, sc.z);
    camera.lookAt(sc.tx, sc.ty, sc.tz);
    return;
  }
  const target = player.car ? player.car : player;
  camYaw += input.consumeMouseDX() * 0.003;
  const dist = player.car ? 13 : 9;
  const height = player.car ? 5.5 : 4.2;
  const cx = player.x - Math.sin(camYaw) * dist;
  const cz = player.z - Math.cos(camYaw) * dist;
  camera.position.lerp(new THREE.Vector3(cx, height, cz), Math.min(1, dt * 6));
  camera.lookAt(player.x, 2, player.z);
  input.camAngle = camYaw;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (game.state === 'playing' && !game.shotFreeze) {
    player.update(dt, input, city.colliders);
    traffic.update(dt);
    peds.update(dt, { x: player.x, z: player.z });
    police.update(dt, player, () => gameOver('BUSTED! SBPD menangkap Jax!'));
    const earned = combat.update(dt, enemies, police);
    if (earned > 0) player.money += earned;
    const dmg = enemies.update(dt, player);
    if (dmg > 0 && player.hurt(dmg)) gameOver('WASTED! Jax tumbang!');
    crew.update(dt, player, enemies, police, combat);
    races.update(dt, player, (r) => {
      player.money += r.prize;
      player.addRespect(15);
      audio.cash();
      hud.showBanner('BALAPAN MENANG: ' + r.name + ' — $' + r.prize + ' — ' + r.time.toFixed(1) + ' dtk (terbaik ' + r.best.toFixed(1) + ')', 5);
      saveGame();
    });
    missions.update(dt, player, police, traffic, races, onMissionDone);
    if (player.car && player.car.health <= 0) {
      player.exitCar();
      hud.showMessage('Mobilmu hancur! Cari mobil lain.', 4);
    }
    radio.update(dt);
    audio.update(dt, game);
    if (player.health <= 0) gameOver('WASTED! Jax tumbang!');
    updateCamera(dt);
    hud.update(dt, game);
  } else if (game.shotFreeze || game.state === 'shop') {
    updateCamera(dt);
    hud.update(dt, game);
  } else if (game.state === 'menu' && params.shot === 'start') {
    camera.position.set(70, 62, 150);
    camera.lookAt(0, 8, 0);
    hud.update(dt, game);
  }
  renderer.render(scene, camera);
}
animate();
