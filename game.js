/**
 * Night-market balloon shoot — original pacing & scoring, homage not a clone.
 */

export const W = 480;
export const H = 640;
export const COLS = 4;
export const ROWS = 5;
export const SLOTS = COLS * ROWS;

export const ROUND_MS = 30_000;
export const START_AMMO = 20;
export const DART_FLIGHT_MS = 220;

/**
 * @typedef {{
 *   id: number,
 *   state: 'empty'|'alive'|'popping',
 *   color: number,
 *   gold: boolean,
 *   born: number,
 *   popAt: number,
 *   sway: number,
 * }} Balloon
 *
 * @typedef {{
 *   x0: number, y0: number,
 *   x1: number, y1: number,
 *   born: number,
 *   hitId: number,
 *   willHit: boolean,
 * }} Dart
 */

export class PopshotGame {
  constructor() {
    this.resetAll();
  }

  resetAll() {
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hits = 0;
    this.misses = 0;
    this.ammo = START_AMMO;
    this.status = "ready"; // ready | playing | over
    this.startedAt = 0;
    this.endsAt = 0;
    this.nextRefill = 0;
    /** @type {Balloon[]} */
    this.balloons = Array.from({ length: SLOTS }, (_, id) => ({
      id,
      state: "empty",
      color: 0,
      gold: false,
      born: 0,
      popAt: 0,
      sway: Math.random() * Math.PI * 2,
    }));
    /** @type {Dart[]} */
    this.darts = [];
  }

  start(now = performance.now()) {
    if (this.status === "over") this.resetAll();
    this.status = "playing";
    this.startedAt = now;
    this.endsAt = now + ROUND_MS;
    this.ammo = START_AMMO;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hits = 0;
    this.misses = 0;
    this.darts = [];
    this.fillBoard(now);
    this.nextRefill = now + 1800;
    return true;
  }

  get timeLeft() {
    if (this.status !== "playing") {
      return this.status === "ready" ? ROUND_MS / 1000 : 0;
    }
    return Math.max(0, (this.endsAt - performance.now()) / 1000);
  }

  /**
   * @param {number} now
   */
  fillBoard(now) {
    for (const b of this.balloons) {
      this.spawnAt(b, now);
    }
  }

  /**
   * @param {Balloon} b
   * @param {number} now
   */
  spawnAt(b, now) {
    b.state = "alive";
    b.born = now;
    b.popAt = 0;
    b.gold = Math.random() < 0.08;
    b.color = b.gold ? -1 : Math.floor(Math.random() * 5);
    b.sway = Math.random() * Math.PI * 2;
  }

  /**
   * Layout helper — cell center for slot id (board region).
   * @param {number} id
   * @returns {{ x: number, y: number, r: number }}
   */
  slotCenter(id) {
    const GRID_TOP = 108;
    const GRID_H = 430;
    const padX = 28;
    const cellW = (W - padX * 2) / COLS;
    const cellH = GRID_H / ROWS;
    const c = id % COLS;
    const r = Math.floor(id / COLS);
    const rBase = Math.min(cellW, cellH) * 0.28;
    return {
      x: padX + cellW * c + cellW / 2,
      y: GRID_TOP + cellH * r + cellH * 0.52,
      r: rBase,
    };
  }

  /**
   * Balloon visual center with sway.
   * @param {Balloon} b
   * @param {number} now
   */
  balloonPos(b, now) {
    const base = this.slotCenter(b.id);
    const age = (now - b.born) / 1000;
    const sx = Math.sin(age * 2.1 + b.sway) * 5;
    const sy = Math.cos(age * 1.7 + b.sway) * 3;
    return { x: base.x + sx, y: base.y + sy, r: base.r };
  }

  /**
   * @param {number} now
   * @returns {{ events: string[], pops: { x: number, y: number, points: number, gold: boolean }[] }}
   */
  update(now) {
    /** @type {string[]} */
    const events = [];
    /** @type {{ x: number, y: number, points: number, gold: boolean }[]} */
    const pops = [];
    if (this.status !== "playing") return { events, pops };

    // Finish pops → empty → later refill
    for (const b of this.balloons) {
      if (b.state === "popping" && now - b.popAt > 320) {
        b.state = "empty";
      }
    }

    // Soft refill empty slots
    if (now >= this.nextRefill) {
      const empty = this.balloons.filter((b) => b.state === "empty");
      if (empty.length) {
        const n = Math.min(empty.length, 1 + Math.floor(Math.random() * 2));
        for (let i = 0; i < n; i++) {
          const pick = empty.splice(Math.floor(Math.random() * empty.length), 1)[0];
          if (pick) {
            this.spawnAt(pick, now);
            events.push("spawn");
          }
        }
      }
      this.nextRefill = now + 900 + Math.random() * 1100;
    }

    // Resolve dart flights
    for (let i = this.darts.length - 1; i >= 0; i--) {
      const d = this.darts[i];
      const age = now - d.born;
      if (age < DART_FLIGHT_MS) continue;
      this.darts.splice(i, 1);
      if (d.willHit && d.hitId >= 0) {
        const b = this.balloons[d.hitId];
        if (b && b.state === "alive") {
          const pos = this.balloonPos(b, now);
          const result = this.popBalloon(b, now);
          events.push(...result.events);
          pops.push({
            x: pos.x,
            y: pos.y,
            points: result.points ?? 0,
            gold: b.gold,
          });
        } else {
          this.combo = 0;
          this.misses += 1;
          events.push("miss");
        }
      } else {
        this.combo = 0;
        this.misses += 1;
        events.push("miss");
      }
    }

    const outOfAmmo = this.ammo <= 0 && this.darts.length === 0;
    const timeUp = now >= this.endsAt;
    if (outOfAmmo || timeUp) {
      this.status = "over";
      this.darts = [];
      events.push("over");
    }

    return { events, pops };
  }

  /**
   * @param {Balloon} b
   * @param {number} now
   */
  popBalloon(b, now) {
    /** @type {string[]} */
    const events = ["pop"];
    b.state = "popping";
    b.popAt = now;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.hits += 1;
    const comboBonus = Math.min(5, this.combo) * 5;
    const goldBonus = b.gold ? 15 : 0;
    const points = 10 + comboBonus + goldBonus;
    this.score += points;
    if (b.gold) events.push("gold");
    if (this.combo > 0 && this.combo % 5 === 0) events.push("combo");
    return { events, points };
  }

  /**
   * Fire a dart toward canvas coords. Spends 1 ammo.
   * @param {number} tx
   * @param {number} ty
   * @param {number} now
   * @returns {{ events: string[], fired: boolean }}
   */
  shoot(tx, ty, now = performance.now()) {
    /** @type {string[]} */
    const events = [];
    if (this.status !== "playing") return { events, fired: false };
    if (this.ammo <= 0) return { events, fired: false };

    this.ammo -= 1;
    events.push("shoot");

    // Find nearest alive balloon within hit radius
    let best = -1;
    let bestD = Infinity;
    let hitPos = { x: tx, y: ty, r: 0 };
    for (const b of this.balloons) {
      if (b.state !== "alive") continue;
      const p = this.balloonPos(b, now);
      const dx = tx - p.x;
      const dy = ty - p.y;
      const d = Math.hypot(dx, dy);
      const hitR = p.r * 1.35;
      if (d <= hitR && d < bestD) {
        bestD = d;
        best = b.id;
        hitPos = p;
      }
    }

    const willHit = best >= 0;
    const x1 = willHit ? hitPos.x : tx;
    const y1 = willHit ? hitPos.y : ty;

    this.darts.push({
      x0: W / 2,
      y0: H - 36,
      x1,
      y1,
      born: now,
      hitId: best,
      willHit,
    });

    return { events, fired: true };
  }
}
