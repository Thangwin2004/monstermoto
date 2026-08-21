export class AudioMixer {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode;
  private static bgmGain: GainNode;
  private static sfxGain: GainNode;
  private static buffers: Map<string, AudioBuffer> = new Map();

  private static currentBgmSource: AudioBufferSourceNode | null = null;
  private static wasContextRunningBeforeFocus = false;

  // Smart audio rate limiters & dynamic variation state
  private static lastShootTime = 0;
  private static lastHitTime = 0;
  private static lastKillTime = 0;
  private static lastExplosionTime = 0;
  private static shootCycle = 0;
  private static hitCycle = 0;
  private static killComboCount = 0;
  private static lastKillComboTime = 0;

  static async init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 1.0;

      // Lower BGM volume so it creates pleasant ambience without overpowering SFX
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.masterGain);
      this.bgmGain.gain.value = 0.18; // Soft, gentle background music

      // Punchy, clear SFX channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = 0.72;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  static async load(key: string, url: string) {
    if (!this.ctx) await this.init();
    if (this.buffers.has(key)) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
      this.buffers.set(key, audioBuffer);
    } catch {
      // Procedural audio is used as primary/fallback engine
    }
  }

  static playBGM(key: string) {
    if (!this.ctx || !this.buffers.has(key)) return;
    this.resume();

    if (this.currentBgmSource) {
      try {
        this.currentBgmSource.stop();
        this.currentBgmSource.disconnect();
      } catch {}
    }

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers.get(key)!;
      source.loop = true;
      source.connect(this.bgmGain);
      source.start();
      this.currentBgmSource = source;
    } catch (e) {
      console.warn("Error playing BGM:", e);
    }
  }

  /** 🔫 Pure Procedural Weapon Sound Synthesis (Crisp, Non-Fatiguing, Rich) */
  static playShoot(type: "bullet" | "flame" | "tesla" | "rocket" = "bullet") {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Rate limiter: Minimum 90ms spacing between weapon sounds
    if (now - this.lastShootTime < 0.09) return;
    this.lastShootTime = now;

    this.shootCycle = (this.shootCycle + 1) % 4;
    const pitchOffset = [-0.08, 0.04, -0.02, 0.09][this.shootCycle];
    const pitch = 1.0 + pitchOffset + (Math.random() - 0.5) * 0.05;

    if (type === "bullet") {
      // 1. Heavy Muzzle Gunpowder Blast & Steel Breech Crack
      this.synthesizeFilteredNoise(0.038, 0.36, 3200 * pitch, 600, "bandpass");

      const crackOsc = this.ctx.createOscillator();
      const crackGain = this.ctx.createGain();
      crackOsc.type = "sawtooth";
      crackOsc.frequency.setValueAtTime(880 * pitch, now);
      crackOsc.frequency.exponentialRampToValueAtTime(160, now + 0.022);
      crackGain.gain.setValueAtTime(0.35, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
      crackOsc.connect(crackGain);
      crackGain.connect(this.sfxGain);
      crackOsc.start(now);
      crackOsc.stop(now + 0.025);

      // 2. Heavy Autocannon Mid-Body Punch (Chamber Resonance)
      const midOsc = this.ctx.createOscillator();
      const midGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      midOsc.type = "triangle";
      midOsc.frequency.setValueAtTime(360 * pitch, now);
      midOsc.frequency.exponentialRampToValueAtTime(80, now + 0.075);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, now);

      midGain.gain.setValueAtTime(0.42, now);
      midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      midOsc.connect(filter);
      filter.connect(midGain);
      midGain.connect(this.sfxGain);

      midOsc.start(now);
      midOsc.stop(now + 0.08);

      // 3. Visceral Sub-Bass Thump / Shockwave (Heavy Bass Kick)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(175 * pitch, now);
      subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.095);

      subGain.gain.setValueAtTime(0.48, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + 0.1);
    } else if (type === "flame") {
      // Warm roaring ignition whoosh
      this.synthesizeFilteredNoise(0.12, 0.22, 600, 200, "bandpass");

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160 * pitch, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.11);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.115);
    } else if (type === "tesla") {
      // High-voltage electric arc snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(780 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.085);
    } else if (type === "rocket") {
      // Heavy ordnance launch whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.16);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.165);
    }
  }

  /** 💥 Crunchy & Punchy Monster Impact Sound (Sharp attack click + warm physical thud) */
  static playHit(isCrit: boolean = false) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Rate limiter: Minimum 50ms spacing between hits to prevent audio mud
    if (now - this.lastHitTime < 0.05) return;
    this.lastHitTime = now;

    // Musical 5-step pitch cycling for rapid bullet hits (Pentatonic: 0st, +2st, +4st, +7st, +9st)
    this.hitCycle = (this.hitCycle + 1) % 5;
    const semitoneMultipliers = [1.0, 1.122, 1.259, 1.498, 1.681];
    const pitch = semitoneMultipliers[this.hitCycle] * (isCrit ? 1.25 : 1.0);

    // 1. High-frequency physical snap / crackle transient
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = "triangle";
    snapOsc.frequency.setValueAtTime(1800 * pitch, now);
    snapOsc.frequency.exponentialRampToValueAtTime(320, now + 0.018);
    snapGain.gain.setValueAtTime(isCrit ? 0.32 : 0.22, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.02);

    // 2. Visceral flesh impact sub-thud
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = "sine";
    const startFreq = (isCrit ? 320 : 220) * pitch;
    thudOsc.frequency.setValueAtTime(startFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(55, now + 0.055);

    thudGain.gain.setValueAtTime(isCrit ? 0.4 : 0.26, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    thudOsc.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.06);
  }

  /** 💀 Rewarding Arcade Monster Defeat / Splat Sound with Combo Arpeggiator */
  static playKill(isElite: boolean = false) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Simultaneous kill grouping: If kills occur within 35ms (e.g. AoE blast), avoid muddy repetition
    const isSimultaneous = now - this.lastKillTime < 0.035;
    this.lastKillTime = now;

    // Maintain kill combo chain if kills occur within 0.85s of each other
    if (now - this.lastKillComboTime < 0.85) {
      this.killComboCount = Math.min(8, this.killComboCount + 1);
    } else {
      this.killComboCount = 1;
    }
    this.lastKillComboTime = now;

    // Melodic Minor Pentatonic scale for rewarding combo streaks:
    // C4 (261Hz) -> Eb4 (311Hz) -> F4 (349Hz) -> G4 (392Hz) -> Bb4 (466Hz) -> C5 (523Hz) -> Eb5 (622Hz) -> G5 (784Hz)
    const comboFrequencies = [
      261.63, 311.13, 349.23, 392.0, 466.16, 523.25, 622.25, 783.99,
    ];
    const baseF = isElite
      ? 180
      : comboFrequencies[(this.killComboCount - 1) % comboFrequencies.length];

    if (isSimultaneous) {
      // For simultaneous multi-kills: Play one deep resonant reward boom instead of noisy duplicates
      const multiOsc = this.ctx.createOscillator();
      const multiGain = this.ctx.createGain();
      multiOsc.type = "sine";
      multiOsc.frequency.setValueAtTime(baseF * 1.5, now);
      multiOsc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
      multiGain.gain.setValueAtTime(0.35, now);
      multiGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      multiOsc.connect(multiGain);
      multiGain.connect(this.sfxGain);
      multiOsc.start(now);
      multiOsc.stop(now + 0.165);
      return;
    }

    // 1. Juicy Arcade "Splat / Coin Pop" Attack
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = "sine";
    popOsc.frequency.setValueAtTime(baseF * 1.8, now);
    popOsc.frequency.exponentialRampToValueAtTime(
      baseF * 0.45,
      now + (isElite ? 0.14 : 0.085),
    );

    popGain.gain.setValueAtTime(isElite ? 0.38 : 0.28, now);
    popGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (isElite ? 0.14 : 0.085),
    );

    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(now);
    popOsc.stop(now + (isElite ? 0.145 : 0.09));

    // 2. Punchy Sub-Bass Crunch Body
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(isElite ? 110 : 160, now);
    subOsc.frequency.exponentialRampToValueAtTime(
      32,
      now + (isElite ? 0.18 : 0.1),
    );

    subGain.gain.setValueAtTime(isElite ? 0.34 : 0.2, now);
    subGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (isElite ? 0.18 : 0.1),
    );

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + (isElite ? 0.185 : 0.105));

    // 3. Dopamine Sparkling Chime on High Combo Streak (Combo >= 5)
    if (this.killComboCount >= 5 && !isElite) {
      const sparkleOsc = this.ctx.createOscillator();
      const sparkleGain = this.ctx.createGain();
      sparkleOsc.type = "sine";
      sparkleOsc.frequency.setValueAtTime(
        1046.5 + this.killComboCount * 120,
        now,
      );
      sparkleGain.gain.setValueAtTime(0.14, now);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(this.sfxGain);
      sparkleOsc.start(now);
      sparkleOsc.stop(now + 0.155);
    }
  }

  /** 💣 Deep Satisfying Explosion Rumble */
  static playExplosion() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    if (now - this.lastExplosionTime < 0.12) return;
    this.lastExplosionTime = now;

    // Filtered noise rumble
    this.synthesizeFilteredNoise(0.25, 0.35, 380, 40, "lowpass");

    // Sub drop punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /** 🌟 Celebratory Level Up Arpeggio Chime */
  static playLevelUp() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Major 7th arpeggio: C5, E5, G5, B5, C6
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.29);
    });
  }

  /** 🪙 Crisp Crystal Scrap Ping */
  static playScrap() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.setValueAtTime(1567.98, now + 0.035); // C6 -> G6 perfect fifth
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.125);
  }

  /** 🔘 UI Button Tap */
  static playButton() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  /** Helper: Synthesizes filtered noise for explosion rumbles and flame bursts */
  private static synthesizeFilteredNoise(
    duration: number,
    volume: number,
    startFreq: number,
    endFreq: number,
    filterType: BiquadFilterType = "lowpass",
  ) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFreq),
      now + duration,
    );

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    source.start(now);
    source.stop(now + duration);
  }

  /** Universal SFX Router -> Routes any key to high-fidelity procedural synth */
  static playSFX(
    key: string,
    _playbackRate: number = 1.0,
    _volume: number = 1.0,
  ) {
    if (!this.ctx) this.init();
    switch (key) {
      case "sfx_button":
        this.playButton();
        break;
      case "sfx_shoot":
        this.playShoot("bullet");
        break;
      case "sfx_hit":
        this.playHit();
        break;
      case "sfx_kill":
      case "sfx_module_destroy":
        this.playKill(true);
        break;
      case "sfx_levelup":
        this.playLevelUp();
        break;
      case "sfx_scrap":
        this.playScrap();
        break;
      case "sfx_explosion":
      case "sfx_boss_spawn":
      case "sfx_shake":
        this.playExplosion();
        break;
      default:
        this.playButton();
        break;
    }
  }

  // Compatibility aliases
  static synthShoot(type: "bullet" | "flame" | "tesla" | "rocket" = "bullet") {
    this.playShoot(type);
  }
  static synthHit(isCrit: boolean = false) {
    this.playHit(isCrit);
  }
  static synthExplosion() {
    this.playExplosion();
  }
  static synthLevelUp() {
    this.playLevelUp();
  }
  static synthScrap() {
    this.playScrap();
  }

  static setMasterVolume(val: number) {
    if (this.masterGain) this.masterGain.gain.value = val;
  }

  static resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  static async pauseForFocus() {
    if (!this.ctx) return;
    this.wasContextRunningBeforeFocus = this.ctx.state === "running";
    if (this.wasContextRunningBeforeFocus) await this.ctx.suspend();
  }

  static async resumeFromFocus() {
    if (!this.ctx || !this.wasContextRunningBeforeFocus) return;
    this.wasContextRunningBeforeFocus = false;
    await this.ctx.resume();
  }
}
