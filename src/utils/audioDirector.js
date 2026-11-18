import { synthFallback } from './synthFallback';

const BASE = import.meta.env.BASE_URL;

export const STAGE_TRACKS = {
  intro: {
    label: 'SPOILER // HYPER',
    src: `${BASE}audio/spoiler.mp3`,
    volume: 0.72,
    startAt: 0, // TIP: If your MP3 has a quiet 1-2s intro, set e.g. startAt: 1.5
    loop: true,
  },
  chill: {
    label: 'LAGUNA BEND // NIGHT CITY',
    src: `${BASE}audio/laguna-bend.mp3`,
    volume: 0.62,
    startAt: 0,
    loop: true,
  },
  rebel: {
    label: 'THE REBEL PATH // CELLO',
    src: `${BASE}audio/rebel-path.mp3`,
    volume: 0.75,
    startAt: 0,
    loop: true,
  },
};

const BAND_BINS = [1, 3, 6, 10, 15, 22, 30];

class AudioDirector {
  constructor() {
    this.audios = {};
    this.fades = {};
    this.connectedAudios = new WeakSet();
    this.currentStage = null;
    this.muted = false;
    this.started = false;
    this.usingFallback = false;
    this.ctx = null;
    this.analyser = null;
    this.freqData = null;
    this.listeners = new Set();
    this.energyCache = { bass: 0, mid: 0, high: 0, bars: [0, 0, 0, 0, 0, 0, 0] };
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const label = this.currentStage ? STAGE_TRACKS[this.currentStage]?.label : '';
    this.listeners.forEach((fn) => fn({ stage: this.currentStage, label }));
  }

  ensureCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.78;
      this.analyser.connect(this.ctx.destination);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  connectToAnalyser(audio) {
    if (!this.ctx || !this.analyser || this.connectedAudios.has(audio)) return;
    try {
      const src = this.ctx.createMediaElementSource(audio);
      src.connect(this.analyser);
      this.connectedAudios.add(audio);
    } catch {
      // Safe fallback
    }
  }

  getAudio(stage) {
    if (this.audios[stage]) return this.audios[stage];
    const cfg = STAGE_TRACKS[stage];
    const audio = new Audio(cfg.src);
    audio.loop = cfg.loop;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.muted = this.muted;
    this.audios[stage] = audio;
    return audio;
  }

  preloadAll() {
    Object.keys(STAGE_TRACKS).forEach((k) => {
      const a = this.getAudio(k);
      a.load();
    });
  }

  fadeTo(stage, targetVol, durationMs = 1400, pauseAtZero = false) {
    const audio = this.getAudio(stage);
    if (this.fades[stage]) cancelAnimationFrame(this.fades[stage]);

    if (durationMs <= 0) {
      audio.volume = Math.max(0, Math.min(1, targetVol));
      if (pauseAtZero && targetVol === 0) audio.pause();
      return;
    }

    const startVol = audio.volume;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * eased));

      if (t < 1) {
        this.fades[stage] = requestAnimationFrame(step);
      } else {
        delete this.fades[stage];
        if (pauseAtZero && targetVol === 0) {
          audio.pause();
        }
      }
    };

    this.fades[stage] = requestAnimationFrame(step);
  }

  // Returns a Promise that resolves right as Spoiler begins outputting sound
  async startIntro() {
    this.started = true;
    this.ensureCtx();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }

    this.preloadAll();

    // Stop any leftover tracks cleanly
    Object.keys(this.audios).forEach((k) => {
      if (k !== 'intro') {
        this.audios[k].pause();
        this.audios[k].volume = 0;
      }
    });

    this.currentStage = 'intro';
    this.notify();

    const cfg = STAGE_TRACKS.intro;
    const audio = this.getAudio('intro');
    audio.muted = this.muted;
    audio.volume = cfg.volume;
    this.connectToAnalyser(audio);

    const seekTime = cfg.startAt || 0;

    // Wait briefly for buffered readiness if still downloading (max 2s safety timeout)
    if (audio.readyState < 3) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 2000);
        const done = () => {
          clearTimeout(timer);
          resolve();
        };
        audio.addEventListener('canplay', done, { once: true });
        audio.addEventListener('error', done, { once: true });
      });
    }

    try {
      audio.currentTime = seekTime;
    } catch {
      // Ignore if metadata still settling
    }

    try {
      await audio.play();
      this.usingFallback = false;
    } catch {
      if (!this.usingFallback) {
        this.usingFallback = true;
        synthFallback.start();
        synthFallback.setMuted(this.muted);
      }
    }
  }

  setStage(nextStage, { restart = false, fadeMs = 1500 } = {}) {
    if (!this.started) return;
    if (this.currentStage === nextStage && !restart) return;

    this.ensureCtx();
    const prevStage = this.currentStage;
    this.currentStage = nextStage;
    this.notify();

    if (prevStage && prevStage !== nextStage) {
      this.fadeTo(prevStage, 0, fadeMs, true);
    }

    const cfg = STAGE_TRACKS[nextStage];
    const audio = this.getAudio(nextStage);
    audio.muted = this.muted;
    this.connectToAnalyser(audio);

    const startPlayback = () => {
      audio
        .play()
        .then(() => {
          this.usingFallback = false;
          this.fadeTo(nextStage, cfg.volume, fadeMs, false);
        })
        .catch(() => {
          if (!this.usingFallback) {
            this.usingFallback = true;
            synthFallback.start();
            synthFallback.setMuted(this.muted);
          }
        });
    };

    if (restart) {
      const seekTime = cfg.startAt || 0;
      if (audio.readyState >= 1) {
        audio.currentTime = seekTime;
        startPlayback();
      } else {
        audio.addEventListener(
          'loadedmetadata',
          () => {
            audio.currentTime = Math.min(seekTime, Math.max(0, audio.duration - 1));
          },
          { once: true }
        );
        startPlayback();
      }
    } else {
      startPlayback();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    Object.values(this.audios).forEach((a) => {
      a.muted = muted;
    });
    if (this.usingFallback) synthFallback.setMuted(muted);
  }

  stopAll() {
    Object.keys(this.fades).forEach((k) => cancelAnimationFrame(this.fades[k]));
    Object.values(this.audios).forEach((a) => {
      a.pause();
      a.volume = 0;
    });
    synthFallback.stop();
  }

  getAudioEnergy() {
    const out = this.energyCache;
    if (!this.started || this.muted) {
      out.bass = 0;
      out.mid = 0;
      out.high = 0;
      for (let i = 0; i < 7; i++) out.bars[i] = 0.08;
      return out;
    }

    if (this.analyser && this.freqData && !this.usingFallback) {
      this.analyser.getByteFrequencyData(this.freqData);
      const d = this.freqData;

      const avg = (from, to) => {
        let sum = 0;
        for (let i = from; i <= to; i++) sum += d[i] || 0;
        return sum / ((to - from + 1) * 255);
      };

      out.bass = Math.pow(avg(0, 4), 1.15);
      out.mid = avg(5, 16);
      out.high = avg(17, 34);
      for (let i = 0; i < 7; i++) {
        out.bars[i] = (d[BAND_BINS[i]] || 0) / 255;
      }
      return out;
    }

    const t = performance.now() * 0.004;
    out.bass = 0.25 + 0.2 * Math.abs(Math.sin(t));
    out.mid = 0.2 + 0.15 * Math.abs(Math.cos(t * 1.3));
    out.high = 0.15 + 0.1 * Math.abs(Math.sin(t * 2.1));
    for (let i = 0; i < 7; i++) {
      out.bars[i] = 0.15 + 0.45 * Math.abs(Math.sin(t + i * 0.65));
    }
    return out;
  }

  playSubDrop() {
    if (this.muted || !this.started) return;
    this.ensureCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.85);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.15);

    const bufferSize = this.ctx.sampleRate * 0.35;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.32);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.22, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);
  }

  playGlitchBlip() {
    if (this.muted || !this.started) return;
    this.ensureCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export const audioDirector = new AudioDirector();