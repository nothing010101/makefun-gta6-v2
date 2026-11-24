// SOLMAR HEAT II — audio.js
// All sound is procedural WebAudio: engine hum, gunshots, punches,
// sirens, cash register, mission jingles. No audio files, no network.
export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenTimer = 0;
    this.sirenStep = 0;
  }
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume?.();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engineOsc.start();
    } catch (e) { this.ctx = null; }
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
  setEngine(speedNorm) {
    if (!this.ctx || !this.engineOsc) return;
    this.engineOsc.frequency.value = 55 + speedNorm * 150;
    this.engineGain.gain.value = this.muted ? 0 : 0.03 + speedNorm * 0.05;
  }
  blip(freq, dur, type = 'square', vol = 0.15, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur);
  }
  shot() { this.blip(170, 0.14, 'square', 0.28); this.blip(85, 0.22, 'sawtooth', 0.22); }
  shotgun() { this.blip(120, 0.25, 'square', 0.34); this.blip(60, 0.3, 'sawtooth', 0.3); }
  punch() { this.blip(120, 0.1, 'sine', 0.22); }
  cash() { this.blip(880, 0.12, 'sine', 0.2); this.blip(1320, 0.18, 'sine', 0.2, 0.09); }
  missionDone() {
    [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.16, 'triangle', 0.2, i * 0.11));
  }
  busted() { this.blip(220, 0.4, 'sawtooth', 0.25); this.blip(165, 0.6, 'sawtooth', 0.25, 0.3); }
  siren(dt) {
    if (!this.ctx || this.muted) return;
    this.sirenTimer += dt;
    if (this.sirenTimer > 0.45) {
      this.sirenTimer = 0;
      this.blip(this.sirenStep % 2 === 0 ? 700 : 950, 0.38, 'sine', 0.05);
      this.sirenStep += 1;
    }
  }
  update(dt, game) {
    if (!this.ctx) return;
    const speedNorm = game.player.car ? Math.min(1, Math.abs(game.player.car.speed) / 60) : 0;
    this.setEngine(speedNorm);
    if (game.police.wanted > 0) this.siren(dt);
  }
}
