// SOLMAR HEAT II — hud.js
// The full HUD: money, respect rank, 5 wanted stars, health + armor bars,
// speed, weapon + ammo, radio station, current mission objective, race
// timer, and a LIVE 2D minimap (roads, beach/sea, mission blip, police
// dots, helicopter, roadblocks, race checkpoint, garage/gun-shop icons).
// Also the message feed, mission-complete banner and menu/game-over/ending.
export class HUD {
  constructor() {
    this.moneyEl = document.getElementById('hud-money');
    this.rankEl = document.getElementById('hud-rank');
    this.starsEl = document.getElementById('hud-stars');
    this.healthEl = document.getElementById('hud-health');
    this.armorEl = document.getElementById('hud-armor');
    this.speedEl = document.getElementById('hud-speed');
    this.weaponEl = document.getElementById('hud-weapon');
    this.radioEl = document.getElementById('hud-radio');
    this.missionEl = document.getElementById('hud-mission');
    this.raceEl = document.getElementById('hud-race');
    this.msgEl = document.getElementById('hud-msg');
    this.feedEl = document.getElementById('hud-feed');
    this.bannerEl = document.getElementById('banner');
    this.menuEl = document.getElementById('menu');
    this.overEl = document.getElementById('gameover');
    this.endEl = document.getElementById('ending');
    this.crossEl = document.getElementById('crosshair');
    this.map = document.getElementById('minimap');
    this.mapCtx = this.map ? this.map.getContext('2d') : null;
    this.msgTimer = 0;
    this.bannerTimer = 0;
    this.feed = [];
  }
  showMessage(text, seconds = 4) {
    if (!this.msgEl) return;
    this.msgEl.textContent = text;
    this.msgEl.style.opacity = '1';
    this.msgTimer = seconds;
    if (this.feedEl) {
      this.feed.unshift(text);
      this.feed = this.feed.slice(0, 3);
      this.feedEl.innerHTML = this.feed.map((f) => '<div>' + f + '</div>').join('');
    }
  }
  showBanner(text, seconds = 4) {
    if (!this.bannerEl) return;
    this.bannerEl.textContent = text;
    this.bannerEl.style.opacity = '1';
    this.bannerTimer = seconds;
  }
  update(dt, game) {
    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0 && this.msgEl) this.msgEl.style.opacity = '0';
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0 && this.bannerEl) this.bannerEl.style.opacity = '0';
    }
    const p = game.player;
    if (this.moneyEl) this.moneyEl.textContent = '$' + Math.floor(p.money).toLocaleString('en-US');
    if (this.rankEl) this.rankEl.textContent = p.rankName + ' · ' + p.respect + ' respect';
    if (this.starsEl) {
      this.starsEl.textContent = '★'.repeat(game.police.wanted) + '☆'.repeat(5 - game.police.wanted);
      this.starsEl.style.color = game.police.wanted >= 4 ? '#ff5544' : '#ffd23f';
    }
    if (this.healthEl) {
      this.healthEl.textContent = 'HP ' + Math.ceil(p.health);
      this.healthEl.style.color = p.health < 30 ? '#ff5544' : '#ffffff';
    }
    if (this.armorEl) this.armorEl.textContent = p.armor > 0 ? 'Armor ' + Math.ceil(p.armor) : '';
    if (this.speedEl) {
      const kmh = Math.round(Math.abs(p.speed || 0) * 3.6);
      this.speedEl.textContent = p.car ? kmh + ' km/h' : '';
    }
    if (this.weaponEl && game.weapons) {
      this.weaponEl.textContent = game.weapons.name() + '  ' + game.weapons.ammoText();
    }
    if (this.radioEl && game.radio) {
      this.radioEl.textContent = '♪ ' + game.radio.current().name;
    }
    const m = game.missions.current();
    if (this.missionEl) {
      if (game.missions.done) this.missionEl.textContent = 'SEMUA MISI SELESAI! Kane kalah — Solmar City milikmu, Jax.';
      else if (m) this.missionEl.textContent = 'MISI ' + m.id + '/10 — ' + m.title + ': ' + m.brief;
    }
    if (this.raceEl) {
      if (game.races.active) {
        this.raceEl.textContent = '🏁 ' + game.races.race.name + ' — CP ' + game.races.cp + '/' + (game.races.race.points.length - 1) + ' — ' + game.races.time.toFixed(1) + ' dtk';
      } else this.raceEl.textContent = '';
    }
    if (this.crossEl) {
      const show = game.state === 'playing' && !p.car;
      this.crossEl.style.display = show ? 'block' : 'none';
    }
    this.drawMinimap(game);
  }
  drawMinimap(game) {
    if (!this.mapCtx) return;
    const ctx = this.mapCtx;
    const S = 170;
    ctx.fillStyle = 'rgba(12,22,34,0.88)';
    ctx.fillRect(0, 0, S, S);
    const toMap = (x, z) => [S / 2 + (x / 230) * (S / 2), S / 2 + (z / 230) * (S / 2)];
    ctx.strokeStyle = '#5a6a7a'; ctx.lineWidth = 2;
    for (let i = -5; i <= 5; i++) {
      const [ax, ay] = toMap(i * 40, -230); const [bx, by] = toMap(i * 40, 230);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      const [cx, cy] = toMap(-230, i * 40); const [dx, dy] = toMap(230, i * 40);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
    }
    ctx.fillStyle = '#1e7fa8'; ctx.fillRect(0, S - 12, S, 12);
    ctx.fillStyle = '#e8d29a'; ctx.fillRect(0, S - 16, S, 4);
    const icon = (x, z, color, label) => {
      const [ix, iy] = toMap(x, z);
      ctx.fillStyle = color;
      ctx.fillRect(ix - 3, iy - 3, 6, 6);
      if (label) { ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.fillText(label, ix + 5, iy + 3); }
    };
    const lm = game.city.landmarks;
    icon(lm.garage.x, lm.garage.z, '#00e5ff', 'G');
    icon(lm.gunshop.x, lm.gunshop.z, '#7dff9a', 'A');
    icon(lm.casino.x, lm.casino.z, '#ffc233', 'C');
    if (game.races.active) {
      const cp = game.races.race.points[game.races.cp];
      if (cp) {
        const [mx, my] = toMap(cp[0], cp[1]);
        ctx.fillStyle = '#ff7a2a';
        ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    const m = game.missions.current();
    if (m && game.missions.targetPos) {
      const [mx, my] = toMap(game.missions.targetPos.x, game.missions.targetPos.z);
      ctx.fillStyle = '#ffc233';
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2); ctx.stroke();
    }
    for (const r of game.police.roadblocks) {
      const [rx, ry] = toMap(r.x, r.z);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(rx - 3, ry - 3, 6, 6);
    }
    for (const u of game.police.units) {
      const [px, py] = toMap(u.x, u.z);
      ctx.fillStyle = '#ff3333';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (game.police.heli.mesh.visible) {
      const [hx, hy] = toMap(game.police.heli.x, game.police.heli.z);
      ctx.fillStyle = '#ffff00';
      ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.fill();
    }
    const [px, py] = toMap(game.player.x, game.player.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  showMenu(show) {
    if (this.menuEl) this.menuEl.style.display = show ? 'flex' : 'none';
    if (show && this.crossEl) this.crossEl.style.display = 'none';
  }
  showGameOver(show, stats) {
    if (!this.overEl) return;
    this.overEl.style.display = show ? 'flex' : 'none';
    if (show && stats) {
      const el = document.getElementById('gameover-stats');
      if (el) el.textContent = stats;
    }
  }
  showEnding(show) {
    if (this.endEl) this.endEl.style.display = show ? 'flex' : 'none';
  }
}
