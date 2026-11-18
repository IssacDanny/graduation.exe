// Pure Web Audio API Cyberpunk Bass/Arp Synth (Fallback if no MP3 is present)
class CyberSynthFallback {
  constructor() {
    this.ctx = null;
    this.interval = null;
    this.isMuted = false;
    this.masterGain = null;
  }

  start() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.18;
    this.masterGain.connect(this.ctx.destination);

    // Dark Cyberpunk Arpeggio notes (Hz)
    const notes = [65.41, 65.41, 77.78, 98.0, 65.41, 116.54, 98.0, 77.78];
    let step = 0;

    this.interval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(notes[step % notes.length], now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(step % 4 === 0 ? 900 : 420, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.16);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.18);
      step++;
    }, 180);
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.18, this.ctx.currentTime);
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.ctx) this.ctx.close();
  }
}

export const synthFallback = new CyberSynthFallback();