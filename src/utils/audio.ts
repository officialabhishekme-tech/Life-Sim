/**
 * High quality procedural Web Audio sound synthesizer
 */

class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playStep() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 + Math.random() * 20, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio failed or muted
    }
  }

  playEat() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.1, 0.2].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260 + idx * 80, now + offset);
        osc.frequency.exponentialRampToValueAtTime(140, now + offset + 0.08);

        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    } catch {}
  }

  playDrink() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [300, 360, 420].forEach((freq, idx) => {
        if (!this.ctx) return;
        const offset = idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + offset + 0.1);

        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {}
  }

  playCashChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const offset = idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.4);
      });
    } catch {}
  }

  playNotification() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  playSlotSpin() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.07, 0.14, 0.21, 0.28].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(540 + idx * 70, now + offset);
        gain.gain.setValueAtTime(0.05, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.04);
      });
    } catch {}
  }

  playWinFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      fanfare.forEach((freq, idx) => {
        if (!this.ctx) return;
        const offset = idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.5);
      });
    } catch {}
  }

  playTransferSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const offset = idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.35);
      });
    } catch {}
  }

  playYawnSleep() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.8);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {}
  }

  playPhoneKey(digit: string) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // DTMF frequencies for standard keypad
      const dtmfMap: Record<string, [number, number]> = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
      };
      const freqs = dtmfMap[digit] || [700, 1200];
      freqs.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch {}
  }

  playHeartbeat() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.14].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now + offset);
        osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.1);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {}
  }

  playVomit() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Guttural gag / retching pulse 1
      [0, 0.35, 0.7].forEach((delay, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const startFreq = 160 - idx * 25;
        osc.frequency.setValueAtTime(startFreq, now + delay);
        osc.frequency.linearRampToValueAtTime(80, now + delay + 0.25);
        gain.gain.setValueAtTime(0.22, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
      });

      // Splashing liquid vomit noise
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now + 0.4);
      filter.frequency.linearRampToValueAtTime(250, now + 0.9);
      const splashGain = this.ctx.createGain();
      splashGain.gain.setValueAtTime(0.18, now + 0.4);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      whiteNoise.connect(filter);
      filter.connect(splashGain);
      splashGain.connect(this.ctx.destination);
      whiteNoise.start(now + 0.4);
    } catch {}
  }
}

export const sounds = new SoundEngine();
