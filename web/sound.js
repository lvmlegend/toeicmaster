// ============================================================================
// 🌸 SAKURA TOEIC ACADEMY - ANIME SOUND & BGM SYNTHESIZER (Web Audio API)
// ============================================================================

class AnimeSoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.sfxVolume = 0.65;
    this.bgmEnabled = false;
    this.bgmVolume = 0.28;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone({ freq = 440, type = 'sine', duration = 0.12, delay = 0, gain = 0.25, slideTo = null }) {
    if (!this.sfxEnabled) return;
    this.init();
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    const peak = Math.max(0.001, gain * this.sfxVolume);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Cute Kawaii Bubble Pop for general buttons
  click() {
    this.playTone({ freq: 587.33, type: 'sine', duration: 0.08, gain: 0.22, slideTo: 880 });
    this.playTone({ freq: 1174.66, type: 'triangle', duration: 0.06, delay: 0.02, gain: 0.12 });
  }

  // Musical note pop when selecting A / B / C / D on answer sheet
  selectOption(letter) {
    const map = {
      A: 523.25, // C5
      B: 587.33, // D5
      C: 659.25, // E5
      D: 783.99  // G5
    };
    const base = map[letter] || 523.25;
    this.playTone({ freq: base, type: 'triangle', duration: 0.11, gain: 0.28, slideTo: base * 1.25 });
    this.playTone({ freq: base * 2, type: 'sine', duration: 0.09, delay: 0.025, gain: 0.14 });
  }

  // Japanese Quiz Show "Pin-Pon! ♪" for Correct Answer
  correct() {
    // Pin (E5) -> Pon (C6) + Sparkle (E6, G6)
    this.playTone({ freq: 659.25, type: 'triangle', duration: 0.14, delay: 0, gain: 0.35 });
    this.playTone({ freq: 1318.5, type: 'sine', duration: 0.12, delay: 0, gain: 0.15 });
    this.playTone({ freq: 1046.5, type: 'triangle', duration: 0.34, delay: 0.13, gain: 0.38 });
    this.playTone({ freq: 1567.98, type: 'sine', duration: 0.28, delay: 0.17, gain: 0.18 });
    this.playTone({ freq: 2093.0, type: 'sine', duration: 0.25, delay: 0.21, gain: 0.14 });
  }

  // Cute Anime "Bubu~" for Wrong Answer (encouraging, not harsh)
  wrong() {
    this.playTone({ freq: 311.13, type: 'sawtooth', duration: 0.13, delay: 0, gain: 0.16, slideTo: 277.18 });
    this.playTone({ freq: 277.18, type: 'sawtooth', duration: 0.24, delay: 0.14, gain: 0.18, slideTo: 207.65 });
  }

  // Soft wind-chime whoosh when switching tabs/tests
  tabSwitch() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone({ freq: n, type: 'sine', duration: 0.1, delay: idx * 0.035, gain: 0.14 });
    });
  }

  // Cute Anime Mascot Voice Chirp ("Piko-Piko~")
  mascotSpeak() {
    const pattern = [783.99, 987.77, 880, 1174.66];
    pattern.forEach((f, idx) => {
      const jitter = f * (0.97 + Math.random() * 0.06);
      this.playTone({ freq: jitter, type: 'sine', duration: 0.07, delay: idx * 0.055, gain: 0.16, slideTo: jitter * 1.12 });
    });
  }

  // JRPG Level-Up / Exam Submit Fanfare!
  fanfare() {
    const melody = [
      { f: 523.25, d: 0.12, t: 0.00 }, // C5
      { f: 659.25, d: 0.12, t: 0.12 }, // E5
      { f: 783.99, d: 0.12, t: 0.24 }, // G5
      { f: 1046.50, d: 0.24, t: 0.36 }, // C6
      { f: 783.99, d: 0.12, t: 0.62 }, // G5
      { f: 1046.50, d: 0.55, t: 0.76 }, // C6
      { f: 1318.51, d: 0.50, t: 0.80 }  // E6 harmony
    ];
    melody.forEach(n => {
      this.playTone({ freq: n.f, type: 'triangle', duration: n.d, delay: n.t, gain: 0.32 });
    });
  }

  // Cheerful Anime Music Box / Chiptune Lo-fi Study BGM
  toggleBgm(forceState) {
    this.init();
    this.bgmEnabled = typeof forceState === 'boolean' ? forceState : !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBgmLoop();
    } else {
      this.stopBgmLoop();
    }
    return this.bgmEnabled;
  }

  startBgmLoop() {
    this.stopBgmLoop();
    // Cozy Japanese Anime Pentatonic Music Box Progression (Fmaj7 -> G6 -> Em7 -> Am7)
    const chords = [
      [349.23, 440.00, 523.25, 659.25], // Fmaj7
      [392.00, 493.88, 587.33, 659.25], // G6
      [329.63, 392.00, 493.88, 587.33], // Em7
      [220.00, 329.63, 440.00, 523.25]  // Am7
    ];
    const melodyNotes = [
      659.25, 783.99, 880.00, 783.99,
      1046.50, 880.00, 783.99, 659.25,
      587.33, 659.25, 783.99, 523.25,
      659.25, 587.33, 523.25, 440.00
    ];

    const playStep = () => {
      if (!this.bgmEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.bgmStep % 16;
      const chord = chords[Math.floor(step / 4)];

      // Play warm chord pad on beat 0 of every 4 steps
      if (step % 4 === 0) {
        chord.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 0.5, now);
          const v = Math.max(0.0005, this.bgmVolume * 0.14);
          g.gain.setValueAtTime(0.0005, now);
          g.gain.linearRampToValueAtTime(v, now + 0.15);
          g.gain.exponentialRampToValueAtTime(0.0005, now + 1.45);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(now + i * 0.03);
          osc.stop(now + 1.5);
        });
      }

      // Play music-box arpeggio note
      const melFreq = melodyNotes[step];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(melFreq, now);
      const peak = Math.max(0.0005, this.bgmVolume * 0.22);
      g.gain.setValueAtTime(0.0005, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0005, now + 0.34);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);

      this.bgmStep++;
    };

    playStep();
    this.bgmTimer = setInterval(playStep, 380);
  }

  stopBgmLoop() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.AnimeSound = new AnimeSoundEngine();
