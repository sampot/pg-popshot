/**
 * Original night-market-ish SFX via Web Audio — no commercial samples.
 */

export class PopshotAudio {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    this.enabled = true;
    this.master = 0.24;
  }

  async unlock() {
    this.ensure();
    if (this.ctx?.state === "suspended") await this.ctx.resume();
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
  }

  setEnabled(on) {
    this.enabled = on;
  }

  /**
   * @param {number} freq
   * @param {number} dur
   * @param {OscillatorType} [type]
   * @param {number} [gain]
   * @param {number} [when]
   */
  tone(freq, dur, type = "square", gain = 0.12, when = 0) {
    if (!this.enabled) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * this.master, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.03, dur));
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /** Soft whoosh / noise-ish dart throw */
  shoot() {
    this.tone(180, 0.05, "sawtooth", 0.07);
    this.tone(420, 0.07, "triangle", 0.055, 0.02);
    this.tone(90, 0.04, "sine", 0.035, 0.01);
  }

  pop() {
    this.tone(260, 0.04, "square", 0.09);
    this.tone(520, 0.05, "triangle", 0.07, 0.03);
    this.tone(120, 0.07, "sawtooth", 0.05, 0.04);
  }

  gold() {
    this.tone(660, 0.07, "square", 0.09);
    this.tone(880, 0.09, "triangle", 0.08, 0.06);
    this.tone(1100, 0.1, "sine", 0.06, 0.12);
  }

  combo() {
    for (let i = 0; i < 4; i++) {
      this.tone(520 * Math.pow(1.15, i), 0.07, "square", 0.08, i * 0.05);
    }
  }

  miss() {
    this.tone(90, 0.06, "sawtooth", 0.04);
    this.tone(70, 0.08, "triangle", 0.03, 0.04);
  }

  spawn() {
    this.tone(340, 0.04, "triangle", 0.04);
  }

  over() {
    this.tone(400, 0.1, "square", 0.09);
    this.tone(300, 0.12, "triangle", 0.08, 0.1);
    this.tone(200, 0.2, "sine", 0.08, 0.22);
  }

  startBeep() {
    this.tone(520, 0.08, "square", 0.1);
    this.tone(780, 0.1, "triangle", 0.08, 0.07);
  }
}
