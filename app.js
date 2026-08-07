import { PopshotAudio } from "./audio.js";
import { PopshotGame, W, H, DART_FLIGHT_MS, START_AMMO, ROUND_MS } from "./game.js";
import {
  drawBooth,
  drawBalloon,
  drawDart,
  drawPopBurst,
  drawCrosshair,
} from "./sprites.js";

const audio = new PopshotAudio();
const game = new PopshotGame();
globalThis.__popshot = game;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const ammoEl = document.getElementById("ammo");
const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const btnStart = document.getElementById("btn-start");
const btnMute = document.getElementById("btn-mute");
const btnReset = document.getElementById("btn-reset");

canvas.width = W;
canvas.height = H;

/** @type {{ x: number, y: number, t: number, gold: boolean }[]} */
const bursts = [];
/** @type {{ x: number, y: number } | null} */
let aim = null;
let running = true;

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function setStatus(msg, tone = "") {
  statusEl.textContent = msg;
  statusEl.dataset.tone = tone;
}

function syncHud() {
  scoreEl.textContent = String(game.score);
  comboEl.textContent = String(game.combo);
  ammoEl.textContent = String(game.status === "ready" ? START_AMMO : game.ammo);
  timeEl.textContent = String(Math.ceil(game.timeLeft));
  if (game.status === "ready") {
    btnStart.textContent = "開台";
    btnStart.disabled = false;
  } else if (game.status === "playing") {
    btnStart.textContent = "射擊中";
    btnStart.disabled = true;
  } else {
    btnStart.textContent = "再來一局";
    btnStart.disabled = false;
  }
}

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function banner(msg) {
  ctx.fillStyle = "rgba(69,26,3,0.55)";
  roundRect(ctx, 40, H / 2 - 28, W - 80, 56, 12);
  ctx.fill();
  ctx.fillStyle = "#fef3c7";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(msg, W / 2, H / 2);
}

function draw() {
  const now = performance.now();
  drawBooth(ctx, W, H);

  // Balloons back-to-front by row
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const id = r * 4 + c;
      const b = game.balloons[id];
      if (b.state === "empty") continue;
      const p = game.balloonPos(b, now);
      drawBalloon(
        ctx,
        p.x,
        p.y,
        p.r,
        b.gold ? -1 : b.color,
        b.state === "popping" ? "popping" : "alive",
        now,
        b.popAt,
      );
    }
  }

  // In-flight darts
  for (const d of game.darts) {
    const t = Math.min(1, (now - d.born) / DART_FLIGHT_MS);
    drawDart(ctx, d.x0, d.y0, d.x1, d.y1, t);
  }

  // Ammo / time bars while playing
  if (game.status === "playing") {
    const ammoRatio = game.ammo / START_AMMO;
    const timeRatio = game.timeLeft / (ROUND_MS / 1000);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    roundRect(ctx, 40, H - 42, W - 80, 10, 5);
    ctx.fill();
    const ag = ctx.createLinearGradient(40, 0, W - 40, 0);
    ag.addColorStop(0, ammoRatio < 0.25 ? "#fb7185" : "#38bdf8");
    ag.addColorStop(1, ammoRatio < 0.25 ? "#fbbf24" : "#2dd4bf");
    ctx.fillStyle = ag;
    roundRect(ctx, 40, H - 42, (W - 80) * ammoRatio, 10, 5);
    ctx.fill();

    // Thin time tick under shelf edge
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    roundRect(ctx, 40, H - 28, W - 80, 5, 2);
    ctx.fill();
    ctx.fillStyle = timeRatio < 0.25 ? "#fb7185" : "#fbbf24";
    roundRect(ctx, 40, H - 28, (W - 80) * timeRatio, 5, 2);
    ctx.fill();
  }

  // Bursts
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const age = (now - b.t) / 320;
    if (age >= 1) bursts.splice(i, 1);
    else drawPopBurst(ctx, b.x, b.y, age, b.gold);
  }

  if (aim && game.status === "playing") {
    drawCrosshair(ctx, aim.x, aim.y);
  }

  if (game.status === "ready") {
    banner("點開台 · 瞄準彩球射鏢");
  } else if (game.status === "over") {
    banner(`收攤！${game.score} 分`);
  } else if (game.combo >= 5) {
    ctx.fillStyle = cssVar("--neon", "#fbbf24");
    ctx.font = "800 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`連擊 ×${game.combo}`, W / 2, 88);
  }
}

function handleEvents(events) {
  for (const e of events) {
    if (e === "spawn") audio.spawn();
    else if (e === "shoot") audio.shoot();
    else if (e === "pop") audio.pop();
    else if (e === "gold") {
      audio.gold();
      setStatus("金氣球！加碼", "win");
    } else if (e === "combo") {
      audio.combo();
      setStatus(`連擊 ×${game.combo}！`, "win");
    } else if (e === "miss") {
      audio.miss();
    } else if (e === "over") {
      audio.over();
      const reason = game.ammo <= 0 ? "飛鏢用盡" : "時間到";
      setStatus(
        `${reason} · ${game.score} 分（命中 ${game.hits}／最佳連擊 ${game.bestCombo}）`,
        "win",
      );
    }
  }
}

function frame(ts) {
  if (!running) return;
  void ts;
  const now = performance.now();
  const { events, pops } = game.update(now);
  for (const p of pops) {
    bursts.push({ x: p.x, y: p.y, t: now, gold: p.gold });
    setStatus(
      `+${p.points}${game.combo > 1 ? ` · 連擊 ${game.combo}` : ""}${p.gold ? " · 金球" : ""}`,
      "win",
    );
  }
  if (events.length) handleEvents(events);
  draw();
  syncHud();
  requestAnimationFrame(frame);
}

async function tryStart() {
  await audio.unlock();
  game.start(performance.now());
  audio.startBeep();
  setStatus("瞄準 · 點擊射鏢！");
  syncHud();
}

function canvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H,
  };
}

btnStart.addEventListener("click", () => {
  void tryStart();
});

btnReset.addEventListener("click", async () => {
  await audio.unlock();
  game.resetAll();
  aim = null;
  bursts.length = 0;
  setStatus("已重來 · 開台開始");
  syncHud();
});

btnMute.addEventListener("click", async () => {
  await audio.unlock();
  audio.setEnabled(!audio.enabled);
  btnMute.textContent = audio.enabled ? "音效開" : "音效關";
  btnMute.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
});

canvas.addEventListener("pointermove", (e) => {
  if (game.status !== "playing") {
    aim = null;
    return;
  }
  aim = canvasPoint(e.clientX, e.clientY);
});

canvas.addEventListener("pointerleave", () => {
  aim = null;
});

canvas.addEventListener("pointerdown", async (e) => {
  await audio.unlock();
  if (game.status !== "playing") {
    void tryStart();
    return;
  }
  const { x, y } = canvasPoint(e.clientX, e.clientY);
  aim = { x, y };
  const { events, fired } = game.shoot(x, y, performance.now());
  handleEvents(events);
  if (!fired) setStatus("沒飛鏢了", "warn");
  else if (game.ammo === 0) setStatus("最後一支飛出去了！", "warn");
});

window.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (game.status !== "playing") void tryStart();
  }
});

document.body.addEventListener(
  "pointerdown",
  () => {
    void audio.unlock();
  },
  { once: true },
);

setStatus("點開台 · 瞄準彩球射鏢");
syncHud();
requestAnimationFrame(() => {
  requestAnimationFrame(frame);
});
