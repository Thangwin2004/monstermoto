export class AudioMixer {
    private static ctx: AudioContext | null = null;
    private static masterGain: GainNode;
    private static bgmGain: GainNode;
    private static sfxGain: GainNode;
    private static buffers: Map<string, AudioBuffer> = new Map();
    
    private static currentBgmSource: AudioBufferSourceNode | null = null;
    private static wasContextRunningBeforeFocus = false;

    // Smart Audio Throttling Timers (Tránh spam âm thanh lặp lại chói tai)
    private static lastShootSoundTime = 0;
    private static lastHitSoundTime = 0;
    private static lastKillSoundTime = 0;
    private static lastExplosionSoundTime = 0;
    private static shootVariationIndex = 0;

    static async init() {
        if (this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioCtx();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.connect(this.masterGain);
            this.bgmGain.gain.value = 0.45;
            
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = 0.65; // Balanced, gentle volume
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
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
            // Buffer failed to load - fallback to synth
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
            console.warn('Error playing BGM:', e);
        }
    }

    static playSFX(key: string, playbackRate: number = 1.0, volume: number = 1.0) {
        if (!this.ctx) return;
        this.resume();
        
        if (this.buffers.has(key)) {
            try {
                const source = this.ctx.createBufferSource();
                source.buffer = this.buffers.get(key)!;
                source.playbackRate.value = playbackRate;
                
                if (volume !== 1.0) {
                    const gain = this.ctx.createGain();
                    gain.gain.value = volume;
                    source.connect(gain);
                    gain.connect(this.sfxGain);
                } else {
                    source.connect(this.sfxGain);
                }
                source.start();
                return;
            } catch {}
        }
    }

    /** 🎯 Non-Repetitive Weapon Fire with Dynamic Pitch & Tone Shifting */
    static playShoot(type: 'bullet' | 'flame' | 'tesla' | 'rocket' = 'bullet') {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Rate limit: Không phát âm thanh súng quá dày (tối thiểu 85ms giữa các tiếng súng)
        if (now - this.lastShootSoundTime < 0.085) return;
        this.lastShootSoundTime = now;

        this.shootVariationIndex = (this.shootVariationIndex + 1) % 4;
        const pitchOffsets = [-0.12, 0.05, -0.04, 0.14];
        const pitchMod = 1.0 + pitchOffsets[this.shootVariationIndex] + (Math.random() - 0.5) * 0.08;

        if (type === 'bullet') {
            // Soft rounded laser pop (sine/triangle sweep - không chói tai như sawtooth)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            const baseFreq = 540 * pitchMod;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.065);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, now);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'flame') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180 * pitchMod, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.1);

            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.105);
        } else if (type === 'tesla') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(680 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.085);
        } else if (type === 'rocket') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.155);
        }
    }

    /** 💥 Punchy & Varied Monster Hit Impact (Smooth rhythmic thuds, no harsh distortion) */
    static playHit(isCrit: boolean = false) {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Rate limit: Tối thiểu 65ms giữa các tiếng trúng đòn
        if (now - this.lastHitSoundTime < 0.065) return;
        this.lastHitSoundTime = now;

        // Nếu có buffer âm thanh thực tế -> Phát ngẫu nhiên pitch
        if (this.buffers.has('sfx_hit')) {
            const rate = isCrit ? 1.25 : (0.92 + Math.random() * 0.28);
            this.playSFX('sfx_hit', rate, isCrit ? 0.65 : 0.45);
            return;
        }

        // Synth fallback: Warm, punchy acoustic sub-thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const startFreq = isCrit ? 260 : (160 + (Math.random() - 0.5) * 40);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

        gain.gain.setValueAtTime(isCrit ? 0.38 : 0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.065);
    }

    /** 💀 Satisfying Monster Defeat / Kill Sound */
    static playKill(isElite: boolean = false) {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        if (now - this.lastKillSoundTime < 0.05) return;
        this.lastKillSoundTime = now;

        if (this.buffers.has('sfx_kill')) {
            const rate = isElite ? 0.85 : (0.95 + Math.random() * 0.25);
            this.playSFX('sfx_kill', rate, isElite ? 0.75 : 0.45);
            return;
        }

        // Synth Pop / Crunch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const startFreq = isElite ? 120 : (280 + Math.random() * 80);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + (isElite ? 0.22 : 0.09));

        gain.gain.setValueAtTime(isElite ? 0.35 : 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isElite ? 0.22 : 0.09));

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + (isElite ? 0.23 : 0.095));
    }

    /** 💣 Explosion with Rate Limiting */
    static playExplosion() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        if (now - this.lastExplosionSoundTime < 0.12) return;
        this.lastExplosionSoundTime = now;

        if (this.buffers.has('sfx_explosion')) {
            this.playSFX('sfx_explosion', 0.95 + (Math.random() - 0.5) * 0.2, 0.55);
            return;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110 + Math.random() * 30, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.24);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    /** 🌟 Level Up Chime */
    static playLevelUp() {
        if (!this.ctx) return;
        this.resume();
        if (this.buffers.has('sfx_levelup')) {
            this.playSFX('sfx_levelup', 1.0, 0.85);
            return;
        }

        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0, now + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.26);
        });
    }

    /** 🪙 Scrap Pickup Sound */
    static playScrap() {
        if (!this.ctx) return;
        this.resume();
        if (this.buffers.has('sfx_scrap')) {
            this.playSFX('sfx_scrap', 0.95 + Math.random() * 0.15, 0.5);
            return;
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.04);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.105);
    }

    // Compatibility aliases for legacy/HMR callers
    static synthShoot(type: 'bullet' | 'flame' | 'tesla' | 'rocket' = 'bullet') { this.playShoot(type); }
    static synthHit(isCrit: boolean = false) { this.playHit(isCrit); }
    static synthExplosion() { this.playExplosion(); }
    static synthLevelUp() { this.playLevelUp(); }
    static synthScrap() { this.playScrap(); }
    
    static setMasterVolume(val: number) {
        if (this.masterGain) this.masterGain.gain.value = val;
    }
    
    static resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    static async pauseForFocus() {
        if (!this.ctx) return;
        this.wasContextRunningBeforeFocus = this.ctx.state === 'running';
        if (this.wasContextRunningBeforeFocus) await this.ctx.suspend();
    }

    static async resumeFromFocus() {
        if (!this.ctx || !this.wasContextRunningBeforeFocus) return;
        this.wasContextRunningBeforeFocus = false;
        await this.ctx.resume();
    }
}
