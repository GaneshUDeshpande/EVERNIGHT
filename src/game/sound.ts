/**
 * High-performance Web Audio API Sound Engine and Procedural Synthesizer.
 * Features polyphonic music sequencing, atmospheric drones, combat audio throttling,
 * boss arrival fanfares, and retro pixel-art audio feedback.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public sfxVolume: number = 0.7;
  public musicVolume: number = 0.45;
  private isMuted: boolean = false;

  // Music sequencer state
  private bgMusicInterval: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;
  private musicIntensity: number = 1; // 1 = early game, 2 = mid game, 3 = intense boss wave

  // Sound throttles to prevent audio distortion in 400+ enemy encounters
  private lastHitSoundTime: number = 0;
  private lastDeathSoundTime: number = 0;
  private lastGemSoundTime: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setIntensity(intensity: number) {
    this.musicIntensity = Math.max(1, Math.min(3, intensity));
  }

  // --- COMBAT WEAPON SOUNDS ---

  public playSlash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playMagicCast() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.exponentialRampToValueAtTime(1975.5, t + 0.11);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playExplosion() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(70, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  public playLightning() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.22);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playDash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playUltimate() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.45);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.52);
    });
  }

  public playShrinePray() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [220, 277.18, 329.63, 440, 554.37];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.82);
    });
  }

  public playAchievementUnlock() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.52);
    });
  }

  // Throttled enemy hit sound to prevent audio blowout
  public playEnemyHit() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const now = performance.now();
    if (now - this.lastHitSoundTime < 45) return; // Max ~22 hits per sec
    this.lastHitSoundTime = now;

    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260 + Math.random() * 60, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);

    gain.gain.setValueAtTime(this.sfxVolume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Throttled enemy death sound
  public playEnemyDeath() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const now = performance.now();
    if (now - this.lastDeathSoundTime < 60) return;
    this.lastDeathSoundTime = now;

    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.11);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Boss Arrival Horn / Warning Cue
  public playBossWarning() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [130.81, 164.81, 196.0, 246.94]; // Deep ominous war horn chord
    notes.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, t + 1.2);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.22);
    });
  }

  public playGemPickup(streak: number = 0) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    const now = performance.now();
    if (now - this.lastGemSoundTime < 35) return;
    this.lastGemSoundTime = now;

    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 587.33; // D5
    const pitchOffset = Math.min(streak * 20, 500);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq + pitchOffset, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + pitchOffset + 240, t + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playCoinPickup() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.06);

    gain.gain.setValueAtTime(this.sfxVolume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playLevelUp() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playChestOpen() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  public playEvolution() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const freqs = [330, 493.88, 659.25, 987.77, 1318.5];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.61);
    });
  }

  public playPlayerHurt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playGameOver() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 415.3, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.41);
    });
  }

  // --- MULTI-SCENARIO PROCEDURAL MUSIC SYNTHESIZER ---
  public currentTheme: 'title' | 'starting' | 'intense' | 'none' = 'none';

  public resumeContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playMusicTheme(theme: 'title' | 'starting' | 'intense') {
    if (this.currentTheme === theme && this.isMusicPlaying) return;
    this.stopMusic();
    this.currentTheme = theme;
    this.isMusicPlaying = true;
    this.initContext();

    if (theme === 'title') {
      this.startTitleMusic();
    } else if (theme === 'intense') {
      this.startIntenseBattleMusic();
    } else {
      this.startStartingMusic();
    }
  }

  public startMusic(theme: 'title' | 'starting' | 'intense' = 'starting') {
    this.playMusicTheme(theme);
  }

  /**
   * Title Theme: "Hymn of the Royal Citadel"
   * Noble medieval-fantasy court melody with warm Renaissance counterpoint.
   */
  private startTitleMusic() {
    // 32-step majestic royal progression (C - G - Am - F - C - Em - F - G)
    const bassNotes = [
      130.81, 0, 130.81, 196.0, 98.0, 0, 146.83, 196.0,
      110.0, 0, 164.81, 220.0, 87.31, 0, 130.81, 174.61,
      130.81, 0, 164.81, 196.0, 82.41, 0, 123.47, 164.81,
      87.31, 0, 130.81, 174.61, 98.0, 146.83, 196.0, 246.94,
    ];

    const leadMelody = [
      523.25, 0, 587.33, 659.25, 783.99, 0, 659.25, 587.33,
      523.25, 0, 440.0, 523.25, 587.33, 0, 523.25, 440.0,
      659.25, 0, 783.99, 880.0, 783.99, 0, 659.25, 523.25,
      587.33, 0, 659.25, 783.99, 783.99, 880.0, 987.77, 1046.5,
    ];

    const harmonyLute = [
      261.63, 329.63, 392.0, 523.25, 196.0, 246.94, 293.66, 392.0,
      220.0, 261.63, 329.63, 440.0, 174.61, 220.0, 261.63, 349.23,
      261.63, 329.63, 392.0, 523.25, 164.81, 196.0, 246.94, 329.63,
      174.61, 220.0, 261.63, 349.23, 196.0, 246.94, 293.66, 392.0,
    ];

    this.bgMusicInterval = window.setInterval(() => {
      if (this.isMuted || this.musicVolume <= 0 || !this.ctx || this.ctx.state !== 'running') {
        return;
      }

      const t = this.ctx.currentTime;
      const step = this.musicStep % 32;
      this.musicStep++;

      // 1. Warm Bassline
      const bassFreq = bassNotes[step];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassGain.gain.setValueAtTime(this.musicVolume * 0.22, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + 0.25);
      }

      // 2. Harpsichord / Lute Arpeggio
      const luteFreq = harmonyLute[step];
      if (luteFreq > 0) {
        const luteOsc = this.ctx.createOscillator();
        const luteGain = this.ctx.createGain();
        luteOsc.type = 'triangle';
        luteOsc.frequency.setValueAtTime(luteFreq, t);

        luteGain.gain.setValueAtTime(this.musicVolume * 0.1, t);
        luteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        luteOsc.connect(luteGain);
        luteGain.connect(this.ctx.destination);
        luteOsc.start(t);
        luteOsc.stop(t + 0.17);
      }

      // 3. Soaring Flute / Trumpet Melody
      const leadFreq = leadMelody[step];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadGain.gain.setValueAtTime(this.musicVolume * 0.14, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(t);
        leadOsc.stop(t + 0.34);
      }
    }, 138); // ~108 BPM
  }

  /**
   * Starting In-Game Theme: "Frontier Skirmish"
   * Driving rhythmic pulse, exploration atmosphere, and wandering chiptune melody.
   */
  private startStartingMusic() {
    const bassNotes = [
      146.83, 146.83, 220.0, 196.0, 116.54, 116.54, 174.61, 146.83,
      130.81, 130.81, 196.0, 164.81, 110.0, 110.0, 164.81, 130.81,
    ];

    const leadArp = [
      587.33, 698.46, 880.0, 1046.5, 932.33, 880.0, 698.46, 587.33,
      523.25, 659.25, 783.99, 987.77, 880.0, 783.99, 659.25, 523.25,
    ];

    this.bgMusicInterval = window.setInterval(() => {
      if (this.isMuted || this.musicVolume <= 0 || !this.ctx || this.ctx.state !== 'running') {
        return;
      }

      const t = this.ctx.currentTime;
      const step = this.musicStep % 16;
      this.musicStep++;

      // 1. Driving Bassline
      const bassFreq = bassNotes[step];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassGain.gain.setValueAtTime(this.musicVolume * 0.18, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(t);
      bassOsc.stop(t + 0.19);

      // 2. High Exploring Chimes
      if (step % 2 === 0) {
        const leadFreq = leadArp[step];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadGain.gain.setValueAtTime(this.musicVolume * 0.09, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(t);
        leadOsc.stop(t + 0.17);
      }

      // 3. Subtle Hi-hat / Kick percussion pulse
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

        kickGain.gain.setValueAtTime(this.musicVolume * 0.2, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.09);
      }
    }, 120); // ~125 BPM
  }

  /**
   * Intense Combat Theme: "Clash of the Colossus"
   * Fast 158 BPM galloping battle march with dramatic brass stabs & soaring tension.
   */
  private startIntenseBattleMusic() {
    const battleBass = [
      146.83, 146.83, 155.56, 146.83, 174.61, 146.83, 220.0, 196.0,
      138.59, 138.59, 146.83, 138.59, 164.81, 138.59, 207.65, 185.0,
      130.81, 130.81, 138.59, 130.81, 155.56, 130.81, 196.0, 174.61,
      123.47, 123.47, 130.81, 123.47, 146.83, 164.81, 185.0, 220.0,
    ];

    const battleStabs = [
      293.66, 0, 0, 0, 311.13, 0, 0, 0,
      277.18, 0, 0, 0, 293.66, 0, 0, 0,
      261.63, 0, 0, 0, 277.18, 0, 0, 0,
      246.94, 0, 0, 0, 293.66, 0, 329.63, 0,
    ];

    const rapidArp = [
      587.33, 622.25, 698.46, 880.0, 783.99, 698.46, 622.25, 587.33,
      554.37, 587.33, 659.25, 830.61, 739.99, 659.25, 587.33, 554.37,
      523.25, 554.37, 622.25, 783.99, 698.46, 622.25, 554.37, 523.25,
      493.88, 523.25, 587.33, 739.99, 659.25, 587.33, 523.25, 493.88,
    ];

    this.bgMusicInterval = window.setInterval(() => {
      if (this.isMuted || this.musicVolume <= 0 || !this.ctx || this.ctx.state !== 'running') {
        return;
      }

      const t = this.ctx.currentTime;
      const step = this.musicStep % 32;
      this.musicStep++;

      // 1. Galloping 16th Bassline
      const bassFreq = battleBass[step];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassGain.gain.setValueAtTime(this.musicVolume * 0.16, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(t);
      bassOsc.stop(t + 0.11);

      // 2. Brass-like Power Chord Stabs
      const stabFreq = battleStabs[step];
      if (stabFreq > 0) {
        const stabOsc = this.ctx.createOscillator();
        const stabGain = this.ctx.createGain();
        stabOsc.type = 'sawtooth';
        stabOsc.frequency.setValueAtTime(stabFreq, t);

        stabGain.gain.setValueAtTime(this.musicVolume * 0.18, t);
        stabGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        stabOsc.connect(stabGain);
        stabGain.connect(this.ctx.destination);
        stabOsc.start(t);
        stabOsc.stop(t + 0.24);
      }

      // 3. High Cascading Arpeggiator
      const arpFreq = rapidArp[step];
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, t);

      arpGain.gain.setValueAtTime(this.musicVolume * 0.08, t);
      arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      arpOsc.connect(arpGain);
      arpGain.connect(this.ctx.destination);
      arpOsc.start(t);
      arpOsc.stop(t + 0.1);

      // 4. Heavy Battle Snare on beats 2 & 4
      if (step % 8 === 4) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, t);
        snareOsc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

        snareGain.gain.setValueAtTime(this.musicVolume * 0.18, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        snareOsc.connect(snareGain);
        snareGain.connect(this.ctx.destination);
        snareOsc.start(t);
        snareOsc.stop(t + 0.09);
      }
    }, 98); // ~153 BPM
  }

  public stopMusic() {
    if (this.bgMusicInterval !== null) {
      clearInterval(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
    this.isMusicPlaying = false;
    this.currentTheme = 'none';
  }
}

export const sound = new SoundSystem();
