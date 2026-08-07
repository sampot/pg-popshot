/**
 * Hand-drawn-style balloons, darts & booth — original art for 射氣球.
 */

const COLORS = [
  { body: ["#fda4af", "#e11d48", "#9f1239"], shine: "#fecdd3" }, // rose
  { body: ["#93c5fd", "#2563eb", "#1e3a8a"], shine: "#bfdbfe" }, // blue
  { body: ["#86efac", "#16a34a", "#14532d"], shine: "#bbf7d0" }, // green
  { body: ["#c4b5fd", "#7c3aed", "#4c1d95"], shine: "#ddd6fe" }, // violet
  { body: ["#fdba74", "#ea580c", "#9a3412"], shine: "#ffedd5" }, // orange
];

const GOLD = {
  body: ["#fef08a", "#eab308", "#a16207"],
  shine: "#fef9c3",
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 */
export function drawBooth(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1e1b4b");
  sky.addColorStop(0.35, "#312e81");
  sky.addColorStop(0.7, "#7c2d12");
  sky.addColorStop(1, "#451a03");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Soft festival glow
  const glow = ctx.createRadialGradient(W / 2, 80, 20, W / 2, 120, 220);
  glow.addColorStop(0, "rgba(251,191,36,0.28)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Decorative lanterns
  for (const lx of [48, W - 48]) {
    ctx.fillStyle = "#b91c1c";
    roundRect(ctx, lx - 12, 36, 24, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(lx, 53, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 28);
    ctx.lineTo(lx, 36);
    ctx.stroke();
  }

  // Title plate
  ctx.fillStyle = "rgba(69,26,3,0.62)";
  roundRect(ctx, W / 2 - 86, 24, 172, 36, 10);
  ctx.fill();
  ctx.fillStyle = "#fef3c7";
  ctx.font = "700 16px system-ui, 'Songti TC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("夜市射氣球", W / 2, 42);

  // Pegboard panel behind balloons
  const panelTop = 96;
  const panelH = 450;
  ctx.fillStyle = "rgba(28,25,23,0.55)";
  roundRect(ctx, 16, panelTop, W - 32, panelH, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(251,191,36,0.22)";
  ctx.lineWidth = 2;
  roundRect(ctx, 16, panelTop, W - 32, panelH, 16);
  ctx.stroke();

  // Peg dots
  ctx.fillStyle = "rgba(168,162,158,0.2)";
  for (let y = panelTop + 28; y < panelTop + panelH - 20; y += 28) {
    for (let x = 36; x < W - 36; x += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Counter / shelf at bottom
  const shelf = ctx.createLinearGradient(0, H - 70, 0, H);
  shelf.addColorStop(0, "#92400e");
  shelf.addColorStop(1, "#451a03");
  ctx.fillStyle = shelf;
  ctx.fillRect(0, H - 58, W, 58);
  ctx.fillStyle = "rgba(253,224,71,0.2)";
  ctx.fillRect(0, H - 58, W, 4);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} colorIdx -1 = gold
 * @param {'alive'|'popping'} state
 * @param {number} now
 * @param {number} popAt
 */
export function drawBalloon(ctx, x, y, r, colorIdx, state, now, popAt) {
  const pal = colorIdx < 0 ? GOLD : COLORS[colorIdx % COLORS.length];
  let scale = 1;
  let alpha = 1;

  if (state === "popping") {
    const a = Math.min(1, (now - popAt) / 320);
    scale = 1 + a * 0.55;
    alpha = 1 - a;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // String
  ctx.strokeStyle = "rgba(231,229,228,0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.95);
  ctx.quadraticCurveTo(4, r * 1.6, -2, r * 2.2);
  ctx.stroke();

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(2, r * 0.15, r * 0.85, r * 0.95, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, pal.body[0]);
  g.addColorStop(0.55, pal.body[1]);
  g.addColorStop(1, pal.body[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.92, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.38, r * 0.22, r * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Knot
  ctx.fillStyle = pal.body[2];
  ctx.beginPath();
  ctx.moveTo(-4, r * 0.88);
  ctx.lineTo(4, r * 0.88);
  ctx.lineTo(0, r * 1.12);
  ctx.closePath();
  ctx.fill();

  // Gold sparkle
  if (colorIdx < 0 && state === "alive") {
    const tw = 0.55 + 0.45 * Math.sin(now / 160);
    ctx.globalAlpha = alpha * tw;
    ctx.fillStyle = "#fef08a";
    ctx.font = "700 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦", -r * 0.7, -r * 0.55);
    ctx.fillText("✦", r * 0.65, -r * 0.2);
  }

  // Pop shards
  if (state === "popping") {
    const a = Math.min(1, (now - popAt) / 320);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pal.shine;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + a;
      const d = r * (0.4 + a * 1.4);
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * d, Math.sin(ang) * d, 3 * (1 - a), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} t 0..1 progress
 */
export function drawDart(ctx, x0, y0, x1, y1, t) {
  const x = x0 + (x1 - x0) * t;
  const y = y0 + (y1 - y0) * t;
  const ang = Math.atan2(y1 - y0, x1 - x0);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);

  // Shaft
  ctx.strokeStyle = "#e7e5e4";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();

  // Tip
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(4, -3.5);
  ctx.lineTo(4, 3.5);
  ctx.closePath();
  ctx.fill();

  // Fletching
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-8, -5);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-8, 5);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} age 0..1
 * @param {boolean} gold
 */
export function drawPopBurst(ctx, x, y, age, gold = false) {
  if (age >= 1) return;
  const a = 1 - age;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = gold ? "#fde047" : "#fbbf24";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(x, y, 12 + age * 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = gold ? "#fef08a" : "#fda4af";
  ctx.beginPath();
  ctx.arc(x, y, 5 * a, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Aiming crosshair
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 */
export function drawCrosshair(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(254,243,199,0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 22, y);
  ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x, y + 22);
  ctx.stroke();
  ctx.fillStyle = "rgba(251,113,133,0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
