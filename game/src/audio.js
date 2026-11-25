// Tiny WebAudio sound effects: every sound is a synthesized blip, so the game ships
// no audio files and makes no network request. Created lazily on the first user
// gesture, because browsers only allow audio after one.
export class SoundFX {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  ensure() {
    if (!this.context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
      } catch {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') void this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /** A short oscillator blip: frequency slides from `from` to `to` over `seconds`. */
  blip(from, to, seconds, type = 'sine', volume = 0.12) {
    if (this.muted || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
  }

  click() { this.blip(700, 900, 0.06, 'triangle', 0.08); }
  chop() { this.blip(300, 140, 0.08, 'square', 0.1); }
  sizzle() { this.blip(1200, 900, 0.15, 'sawtooth', 0.04); }
  ding() { this.blip(880, 1320, 0.25, 'sine', 0.14); }
  coin() {
    this.blip(990, 990, 0.07, 'sine', 0.12);
    setTimeout(() => this.blip(1320, 1320, 0.12, 'sine', 0.12), 70);
  }
  buzz() { this.blip(160, 90, 0.3, 'sawtooth', 0.14); }
  alarm() { this.blip(520, 780, 0.18, 'square', 0.1); }
  win() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.blip(freq, freq, 0.22, 'triangle', 0.13), i * 110);
    });
  }
}
