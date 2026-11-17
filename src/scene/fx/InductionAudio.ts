/**
 * Diegetic Web Audio Synthesizer for Induction Furnace Hum & Tilting Gearbox Motor.
 */

class InductionAudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  // Medium-frequency inverter whine (GW-IF Series Thyristor / IGBT resonance ~1050Hz - 1400Hz)
  private inverterOsc: OscillatorNode | null = null;
  private inverterGain: GainNode | null = null;
  private inverterFilter: BiquadFilterNode | null = null;

  // Molten Metal Pouring Stream Fluid Audio (heavy viscous fluid splash & hiss)
  private pourNoiseNode: AudioBufferSourceNode | null = null;
  private pourGain: GainNode | null = null;
  private pourFilter: BiquadFilterNode | null = null;

  // Mechanical Tilting Reducer & Hydraulic Pump Motor audio
  private motorOsc: OscillatorNode | null = null;
  private motorHarmonicOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master gain node
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Low-pass filter to simulate enclosure & deep hum
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(3.0, this.ctx.currentTime);

      // Connect filter to gain to destination
      this.gainNode.connect(this.ctx.destination);
      this.filterNode.connect(this.gainNode);

      // Oscillator 1: Fundamental line frequency harmonic (120 Hz)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.osc1.connect(this.filterNode);

      // Oscillator 2: High harmonic / induction pitch (360 Hz)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(360, this.ctx.currentTime);
      this.osc2.connect(this.filterNode);

      // Sub-bass hum (60 Hz)
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'sine';
      this.oscSub.frequency.setValueAtTime(60, this.ctx.currentTime);
      this.oscSub.connect(this.gainNode);

      this.osc1.start();
      this.osc2.start();
      this.oscSub.start();

      // Inverter medium-frequency whine (GW-IF Series ~1050 Hz)
      this.inverterGain = this.ctx.createGain();
      this.inverterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.inverterGain.connect(this.ctx.destination);

      this.inverterFilter = this.ctx.createBiquadFilter();
      this.inverterFilter.type = 'bandpass';
      this.inverterFilter.frequency.setValueAtTime(1050, this.ctx.currentTime);
      this.inverterFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);
      this.inverterFilter.connect(this.inverterGain);

      this.inverterOsc = this.ctx.createOscillator();
      this.inverterOsc.type = 'triangle';
      this.inverterOsc.frequency.setValueAtTime(1050, this.ctx.currentTime);
      this.inverterOsc.connect(this.inverterFilter);
      this.inverterOsc.start();

      // Gearbox Motor & Hydraulic Power Unit (HPU) sound
      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.motorGain.connect(this.ctx.destination);

      this.motorOsc = this.ctx.createOscillator();
      this.motorOsc.type = 'sawtooth';
      this.motorOsc.frequency.setValueAtTime(75, this.ctx.currentTime);
      this.motorOsc.connect(this.motorGain);
      this.motorOsc.start();

      this.motorHarmonicOsc = this.ctx.createOscillator();
      this.motorHarmonicOsc.type = 'sine';
      this.motorHarmonicOsc.frequency.setValueAtTime(150, this.ctx.currentTime);
      this.motorHarmonicOsc.connect(this.motorGain);
      this.motorHarmonicOsc.start();

      // Molten Metal Stream Pouring Sound (Looping Pink/Filtered Noise)
      this.pourGain = this.ctx.createGain();
      this.pourGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.pourGain.connect(this.ctx.destination);

      this.pourFilter = this.ctx.createBiquadFilter();
      this.pourFilter.type = 'bandpass';
      this.pourFilter.frequency.setValueAtTime(700, this.ctx.currentTime);
      this.pourFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);
      this.pourFilter.connect(this.pourGain);

      // 2-second looped noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.6;
      }
      this.pourNoiseNode = this.ctx.createBufferSource();
      this.pourNoiseNode.buffer = noiseBuffer;
      this.pourNoiseNode.loop = true;
      this.pourNoiseNode.connect(this.pourFilter);
      this.pourNoiseNode.start();

      this.isInitialized = true;
    } catch {
      // AudioContext may be restricted until user gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.isInitialized) {
      this.init();
    }
  }

  public update(powerFraction: number, isTilting: boolean = false, isPouring: boolean = false) {
    if (!this.ctx || !this.gainNode || !this.filterNode || !this.osc1 || !this.osc2 || !this.oscSub) {
      return;
    }

    if (this.ctx.state === 'suspended') {
      return;
    }

    const now = this.ctx.currentTime;
    const clampedPower = Math.max(0, Math.min(powerFraction, 1.0));

    const targetGain = clampedPower > 0.005 ? Math.pow(clampedPower, 1.2) * 0.22 : 0.0;
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.08);

    const baseFreq = 100 + clampedPower * 80;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.8, now, 0.08);
    this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

    const filterFreq = 300 + clampedPower * 850;
    this.filterNode.frequency.setTargetAtTime(filterFreq, now, 0.08);

    // Inverter whine modulation (shifts smoothly from 1050 Hz to 1380 Hz with power)
    if (this.inverterGain && this.inverterOsc && this.inverterFilter) {
      const inverterTargetGain = clampedPower > 0.005 ? Math.pow(clampedPower, 1.5) * 0.085 : 0.0;
      this.inverterGain.gain.setTargetAtTime(inverterTargetGain, now, 0.06);
      const inverterFreq = 1050 + clampedPower * 330;
      this.inverterOsc.frequency.setTargetAtTime(inverterFreq, now, 0.06);
      this.inverterFilter.frequency.setTargetAtTime(inverterFreq, now, 0.06);
    }

    // Motor gearbox & hydraulic sound
    if (this.motorGain && this.motorOsc) {
      const motorTargetGain = isTilting ? 0.10 : 0.0;
      this.motorGain.gain.setTargetAtTime(motorTargetGain, now, 0.05);
    }

    // Molten metal stream pouring sound
    if (this.pourGain && this.pourFilter) {
      const pourTargetGain = isPouring ? 0.12 : 0.0;
      this.pourGain.gain.setTargetAtTime(pourTargetGain, now, 0.06);
    }
  }

  public playClick() {
    if (!this.ctx) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore
    }
  }

  public playDetent() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // ignore
    }
  }

  // Industrial Pyrometer Temperature Stable Beep (1760 Hz High Precision Beep)
  public playBeep() {
    this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  // SOP Task Step Completed Success Chime (Two-Tone Rising Harmony 523Hz -> 784Hz)
  public playSuccess() {
    this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  // Heavy Industrial Scrap Metal Impact / Drop Clank Sound
  public playClank() {
    this.resume();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(240, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.35);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1150, now);
      osc2.frequency.exponentialRampToValueAtTime(320, now + 0.22);
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  // Heavy Power Contactor Mechanical Impact ("JEGLEK-KLANG")
  public playContactor() {
    this.resume();
    this.vibrate([40, 30, 80]);
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  // Module Graduation Fanfare Music
  public playFanfare() {
    this.resume();
    this.vibrate([100, 50, 100, 50, 200]);
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const time = this.ctx!.currentTime + idx * 0.14;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.35);
      });
    } catch {
      // ignore
    }
  }

  // Smartphone Physical Vibration API (Haptic Feedback)
  public vibrate(pattern: number | number[] = 50) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }

  // High-Pressure Gas / CO2 Extinguisher Spray Sound
  private sprayNoiseNode: AudioBufferSourceNode | null = null;
  private sprayGain: GainNode | null = null;
  private sprayFilter: BiquadFilterNode | null = null;

  public startSpray() {
    this.resume();
    if (!this.ctx || this.sprayNoiseNode) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.sprayNoiseNode = this.ctx.createBufferSource();
      this.sprayNoiseNode.buffer = buffer;
      this.sprayNoiseNode.loop = true;

      this.sprayFilter = this.ctx.createBiquadFilter();
      this.sprayFilter.type = 'bandpass';
      this.sprayFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      this.sprayFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.sprayGain = this.ctx.createGain();
      this.sprayGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.sprayGain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.05);

      this.sprayNoiseNode.connect(this.sprayFilter);
      this.sprayFilter.connect(this.sprayGain);
      this.sprayGain.connect(this.ctx.destination);
      this.sprayNoiseNode.start();
    } catch {
      // ignore
    }
  }

  public stopSpray() {
    if (!this.ctx || !this.sprayGain || !this.sprayNoiseNode) return;
    try {
      this.sprayGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      const node = this.sprayNoiseNode;
      setTimeout(() => {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // ignore
        }
      }, 60);
      this.sprayNoiseNode = null;
    } catch {
      // ignore
    }
  }
}

export const inductionAudio = new InductionAudioEngine();
