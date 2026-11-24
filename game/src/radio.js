// SOLMAR HEAT II — radio.js
// Three procedural WebAudio radio stations, cycled with R. Each station
// is a looping step sequencer (bass + lead notes) with its own tempo and
// scale, so the city always has music without any audio files.
//   0 SOLMAR FM — sunny synth-pop, 100 BPM
//   1 NEON 88   — fast electro bass, 128 BPM
//   2 PLAYA WAVES — slow beach chords, 72 BPM
export const STATIONS = [
  { name: 'SOLMAR FM', bpm: 100, bass: [55, 65.4, 49, 58.3], lead: [220, 261.6, 329.6, 392, 440, 523.3, 392, 329.6] },
  { name: 'NEON 88', bpm: 128, bass: [41.2, 41.2, 49, 55], lead: [440, 523.3, 659.3, 523.3, 587.3, 659.3, 880, 659.3] },
  { name: 'PLAYA WAVES', bpm: 72, bass: [65.4, 49, 58.3, 73.4], lead: [261.6, 329.6, 392, 329.6, 293.7, 392, 440, 392] },
];

export class Radio {
  constructor(audio) {
    this.audio = audio;
    this.station = 0;
    this.step = 0;
    this.timer = 0;
  }
  current() { return STATIONS[this.station]; }
  next() {
    this.station = (this.station + 1) % STATIONS.length;
    this.step = 0;
    return this.current().name;
  }
  update(dt) {
    const a = this.audio;
    if (!a.ctx || a.muted) return;
    const st = this.current();
    const stepDur = 60 / st.bpm / 2;
    this.timer += dt;
    if (this.timer < stepDur) return;
    this.timer = 0;
    const i = this.step % 8;
    const bassNote = st.bass[Math.floor(this.step / 2) % st.bass.length];
    a.blip(bassNote, stepDur * 1.8, 'triangle', 0.09);
    if (i % 2 === 0) a.blip(st.lead[i], stepDur * 1.4, 'sine', 0.05);
    this.step += 1;
  }
}
