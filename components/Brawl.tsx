"use client";

import { useEffect, useRef } from "react";
import { equippedTechniques, maxHp } from "@/lib/game/engine";
import type { BrawlOutcome, DuelContext, Enemy, PlayerState, Technique } from "@/lib/game/types";

const W = 960;
const H = 540;
const GROUND = 430;
const PX = 300; // player x
const EX = 660; // enemy x
const STUN_P = 420;
const PERFECT_MS = 160;

const ONO = {
  jab: ["バッ", "スパッ", "ピシッ", "タッ"],
  strong: ["ドゴォ！", "バキィ！", "ゴッ！", "ズバッ！"],
  special: ["ズドーン！！", "轟ッ！！", "ぬぅんっ！！"],
  enemy: ["グハッ", "ゴッ", "ガッ", "うぐっ"],
  guard: ["ガキィン", "ギャリッ"],
  perfect: ["ジャストガード！"],
};
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

type PPhase = "idle" | "attack" | "hitstun" | "down";
type EPhase = "idle" | "windup" | "strike" | "recover" | "hitstun" | "down";

interface Fx {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
}

interface Game {
  pHp: number;
  pHpMax: number;
  eHp: number;
  eHpMax: number;
  kiai: number;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  specials: number;
  perfectGuards: number;
  usedWeapon: boolean;
  weaponAvail: boolean;
  weaponOn: boolean;
  pPhase: PPhase;
  pTimer: number;
  atk: { tech: Technique; t: number; windup: number; recover: number; hit: boolean } | null;
  guard: boolean;
  guardStart: number;
  pLunge: number;
  eLunge: number;
  ePhase: EPhase;
  eTimer: number;
  eNext: number;
  result: null | "win" | "lose";
  endTimer: number;
  shake: number;
  flash: number;
  flashP: number;
  flashE: number;
  banner: string;
  bannerTimer: number;
  fx: Fx[];
  time: number;
}

export function Brawl({
  player,
  enemy,
  ctx,
  hasWeapon,
  onFinish,
}: {
  player: PlayerState;
  enemy: Enemy;
  ctx: DuelContext;
  hasWeapon: boolean;
  onFinish: (o: BrawlOutcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const ctrlRef = useRef<{
    action: (k: "jab" | "strong" | "special") => void;
    setGuard: (v: boolean) => void;
    toggleWeapon: () => void;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const tech = equippedTechniques(player);
    const eInterval = enemy.attackMs;
    const eWindup = enemy.windupMs;
    const eRecover = 450;

    const g: Game = {
      pHp: maxHp(player.banchoDo),
      pHpMax: maxHp(player.banchoDo),
      eHp: enemy.maxHp,
      eHpMax: enemy.maxHp,
      kiai: ctx.menchiWon ? 20 : 0,
      combo: 0,
      comboTimer: 0,
      maxCombo: 0,
      specials: 0,
      perfectGuards: 0,
      usedWeapon: false,
      weaponAvail: hasWeapon,
      weaponOn: false,
      pPhase: "idle",
      pTimer: 0,
      atk: null,
      guard: false,
      guardStart: -9999,
      pLunge: 0,
      eLunge: 0,
      ePhase: "idle",
      eTimer: 0,
      eNext: eInterval * 0.8,
      result: null,
      endTimer: 0,
      shake: 0,
      flash: 0,
      flashP: 0,
      flashE: 0,
      banner: "",
      bannerTimer: 0,
      fx: [],
      time: 0,
    };

    // 先制 / メンチ補正
    if (ctx.firstStrike === "player") {
      g.eNext = eInterval + 900;
      g.banner = ctx.cheapShot ? "不意打ち！" : "先手必勝！";
      g.bannerTimer = 1300;
    } else if (ctx.firstStrike === "enemy") {
      g.eNext = 520;
      g.banner = "不意を突かれた！";
      g.bannerTimer = 1300;
    }
    if (ctx.menchiWon === true) g.eNext += 300;
    else if (ctx.menchiWon === false) g.eNext = Math.max(300, g.eNext - 220);

    const spawnFx = (x: number, y: number, text: string, color: string, size: number) => {
      g.fx.push({ x, y, vy: -0.04, life: 700, max: 700, text, color, size });
    };

    const playerHit = (t: Technique) => {
      const mult = (g.weaponOn ? 1.6 : 1) * (1 + Math.min(g.combo, 10) * 0.03);
      const dmg = t.damage * mult;
      g.eHp -= dmg;
      if (g.weaponOn) g.usedWeapon = true;
      g.combo += 1;
      g.comboTimer = 1200;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      if (t.type !== "special") g.kiai = Math.min(100, g.kiai + t.kiaiGain);
      g.flashE = 120;
      const ono = t.type === "special" ? pick(ONO.special) : t.type === "strong" ? pick(ONO.strong) : pick(ONO.jab);
      spawnFx(EX - 20, GROUND - 150, ono, t.type === "jab" ? "#fff" : "#ffd60a", t.type === "special" ? 64 : t.type === "strong" ? 46 : 32);
      if (t.type === "strong") g.shake = Math.max(g.shake, 8);
      if (t.type === "special") {
        g.shake = Math.max(g.shake, 16);
        g.flash = 0.5;
        g.specials += 1;
        g.ePhase = "hitstun";
        g.eTimer = 0;
        g.eLunge = -26;
      }
      if (g.eHp <= 0) {
        g.eHp = 0;
        g.ePhase = "down";
        g.result = "win";
        g.endTimer = 0;
        spawnFx(EX, GROUND - 180, "K.O.!!", "#c1121f", 80);
      }
    };

    const doAction = (kind: "jab" | "strong" | "special") => {
      if (g.result || g.pPhase === "hitstun" || g.pPhase === "down" || g.pPhase === "attack") return;
      let t: Technique | undefined;
      if (kind === "jab") t = tech.jab;
      else if (kind === "strong") t = tech.strong;
      else {
        const affordable = tech.specials.filter((s) => g.kiai >= s.kiaiCost).sort((a, b) => b.kiaiCost - a.kiaiCost);
        t = affordable[0];
        if (!t) {
          spawnFx(PX, GROUND - 200, "気合不足！", "#38bdf8", 28);
          return;
        }
        g.kiai -= t.kiaiCost;
      }
      g.pPhase = "attack";
      g.atk = { tech: t, t: 0, windup: t.windupMs, recover: t.recoverMs, hit: false };
      g.pLunge = 0;
    };

    const resolveEnemyStrike = () => {
      const guarding = g.guard && g.pPhase === "idle";
      if (guarding) {
        const gdur = g.time - g.guardStart;
        if (gdur <= PERFECT_MS) {
          g.perfectGuards += 1;
          g.kiai = Math.min(100, g.kiai + 18);
          g.ePhase = "hitstun";
          g.eTimer = 0;
          g.eLunge = -20;
          spawnFx(PX, GROUND - 210, pick(ONO.perfect), "#ffd60a", 40);
          g.flash = 0.35;
          g.shake = Math.max(g.shake, 6);
          return;
        }
        g.pHp -= enemy.power * 0.25;
        g.kiai = Math.min(100, g.kiai + 6);
        spawnFx(PX, GROUND - 160, pick(ONO.guard), "#cbd5e1", 30);
      } else {
        g.pHp -= enemy.power;
        g.pPhase = "hitstun";
        g.pTimer = 0;
        g.atk = null;
        g.combo = 0;
        g.flashP = 150;
        g.shake = Math.max(g.shake, 10);
        spawnFx(PX, GROUND - 150, pick(ONO.enemy), "#fff", 40);
        if (g.pHp <= 0) {
          g.pHp = 0;
          g.pPhase = "down";
          g.result = "lose";
          g.endTimer = 0;
          spawnFx(PX, GROUND - 180, "ダウン…", "#c1121f", 64);
        }
      }
    };

    ctrlRef.current = {
      action: doAction,
      setGuard: (v: boolean) => {
        if (v && !g.guard && g.pPhase === "idle") g.guardStart = g.time;
        g.guard = v;
      },
      toggleWeapon: () => {
        if (g.weaponAvail) g.weaponOn = !g.weaponOn;
      },
    };

    // ── input ──
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "f") {
        e.preventDefault();
        ctrlRef.current?.setGuard(down);
        return;
      }
      if (!down) return;
      if (k === "j") ctrlRef.current?.action("jab");
      else if (k === "k") ctrlRef.current?.action("strong");
      else if (k === "l") ctrlRef.current?.action("special");
      else if (k === "w") ctrlRef.current?.toggleWeapon();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // ── update ──
    const update = (dt: number) => {
      g.time += dt;
      g.shake = Math.max(0, g.shake - dt * 0.04);
      g.flash = Math.max(0, g.flash - dt * 0.002);
      g.flashP = Math.max(0, g.flashP - dt);
      g.flashE = Math.max(0, g.flashE - dt);
      g.bannerTimer = Math.max(0, g.bannerTimer - dt);
      g.pLunge += ((g.pPhase === "attack" ? 26 : 0) - g.pLunge) * Math.min(1, dt * 0.02);
      g.eLunge += ((g.ePhase === "strike" || g.ePhase === "windup" ? -16 : 0) - g.eLunge) * Math.min(1, dt * 0.01);

      if (g.comboTimer > 0) {
        g.comboTimer -= dt;
        if (g.comboTimer <= 0) g.combo = 0;
      }
      for (const f of g.fx) {
        f.life -= dt;
        f.y += f.vy * dt;
      }
      g.fx = g.fx.filter((f) => f.life > 0);

      if (g.result) {
        g.endTimer += dt;
        if (g.endTimer >= 1500) finish();
        return;
      }

      // player
      if (g.pPhase === "attack" && g.atk) {
        g.atk.t += dt;
        if (!g.atk.hit && g.atk.t >= g.atk.windup) {
          g.atk.hit = true;
          playerHit(g.atk.tech);
        }
        if (g.atk.t >= g.atk.windup + g.atk.recover) {
          g.pPhase = "idle";
          g.atk = null;
        }
      } else if (g.pPhase === "hitstun") {
        g.pTimer += dt;
        if (g.pTimer >= STUN_P) g.pPhase = "idle";
      }

      // enemy
      if (g.ePhase !== "down") {
        g.eTimer += dt;
        if (g.ePhase === "idle") {
          if (g.eTimer >= g.eNext) {
            g.ePhase = "windup";
            g.eTimer = 0;
          }
        } else if (g.ePhase === "windup") {
          if (g.eTimer >= eWindup) {
            g.ePhase = "strike";
            g.eTimer = 0;
            resolveEnemyStrike();
            if (!g.result) {
              g.ePhase = "recover";
              g.eTimer = 0;
            }
          }
        } else if (g.ePhase === "recover") {
          if (g.eTimer >= eRecover) {
            g.ePhase = "idle";
            g.eTimer = 0;
            g.eNext = eInterval * (0.7 + Math.random() * 0.4);
          }
        } else if (g.ePhase === "hitstun") {
          if (g.eTimer >= 320) {
            g.ePhase = "idle";
            g.eTimer = 0;
            g.eNext = eInterval * 0.5;
          }
        }
      }
    };

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      const outcome: BrawlOutcome = {
        win: g.result === "win",
        maxCombo: g.maxCombo,
        usedWeapon: g.usedWeapon,
        specials: g.specials,
        hpRatio: Math.max(0, g.pHp) / g.pHpMax,
        perfectGuards: g.perfectGuards,
      };
      onFinishRef.current(outcome);
    };

    // ── render ──
    const drawBar = (x: number, y: number, w: number, ratio: number, color: string, label: string, right: boolean) => {
      c.fillStyle = "#0a0908";
      c.fillRect(x - 2, y - 2, w + 4, 18);
      c.fillStyle = "#3b3b3b";
      c.fillRect(x, y, w, 14);
      c.fillStyle = color;
      const ww = Math.max(0, Math.min(1, ratio)) * w;
      c.fillRect(right ? x + w - ww : x, y, ww, 14);
      c.fillStyle = "#fff";
      c.font = "900 16px system-ui";
      c.textAlign = right ? "right" : "left";
      c.fillText(label, right ? x + w : x, y - 6);
    };

    const drawFighter = (
      x: number,
      dir: 1 | -1,
      gakuran: string,
      skin: string,
      pose: PPhase | EPhase | "guard",
      lunge: number,
      flash: number,
    ) => {
      const bx = x + lunge * dir;
      // 影
      c.fillStyle = "rgba(0,0,0,.35)";
      c.beginPath();
      c.ellipse(x, GROUND + 10, 46, 12, 0, 0, Math.PI * 2);
      c.fill();

      if (pose === "down") {
        c.save();
        c.translate(bx, GROUND - 20);
        c.rotate(dir * 1.4);
        c.fillStyle = gakuran;
        c.fillRect(-30, -20, 90, 40);
        c.fillStyle = skin;
        c.beginPath();
        c.arc(60, 0, 20, 0, Math.PI * 2);
        c.fill();
        c.restore();
        return;
      }

      const topY = GROUND - 150;
      // 脚
      c.fillStyle = "#11151f";
      c.fillRect(bx - 20, GROUND - 70, 16, 70);
      c.fillRect(bx + 6, GROUND - 70, 16, 70);
      // 胴（学ラン）
      c.fillStyle = gakuran;
      c.fillRect(bx - 28, topY, 56, 92);
      // 襟
      c.fillStyle = "#fff";
      c.fillRect(bx - 28, topY, 56, 8);
      // ボタン
      c.fillStyle = "#ffc300";
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(bx, topY + 22 + i * 22, 3, 0, Math.PI * 2);
        c.fill();
      }
      // 腕
      c.fillStyle = gakuran;
      if (pose === "guard") {
        c.fillRect(bx + dir * 16, topY + 10, 22, 46);
        c.fillStyle = "#fff";
        c.fillRect(bx + dir * 22, topY + 6, 8, 54);
      } else if (pose === "attack" || pose === "strike" || pose === "windup") {
        const reach = pose === "windup" ? 18 : 52;
        c.fillRect(Math.min(bx, bx + dir * reach), topY + 18, Math.abs(dir * reach) + 14, 16);
        c.fillStyle = skin;
        c.beginPath();
        c.arc(bx + dir * (reach + 14), topY + 26, 10, 0, Math.PI * 2);
        c.fill();
      } else if (pose === "hitstun") {
        c.fillRect(bx - dir * 24, topY + 8, 20, 16);
      } else {
        c.fillRect(bx - 34, topY + 16, 14, 40);
        c.fillRect(bx + 20, topY + 16, 14, 40);
      }
      // 頭
      const hy = topY - 22;
      c.fillStyle = skin;
      c.beginPath();
      c.arc(bx, hy, 22, 0, Math.PI * 2);
      c.fill();
      // 髪（リーゼント風）
      c.fillStyle = "#0a0908";
      c.beginPath();
      c.arc(bx, hy - 6, 22, Math.PI, Math.PI * 2);
      c.fill();
      c.fillRect(bx - 22, hy - 8, 44, 6);
      // 眉・目
      c.strokeStyle = "#0a0908";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(bx - 14, hy - 4);
      c.lineTo(bx - 4, hy);
      c.moveTo(bx + 14, hy - 4);
      c.lineTo(bx + 4, hy);
      c.stroke();
      c.fillStyle = "#0a0908";
      c.fillRect(bx - 10, hy + 1, 5, 4);
      c.fillRect(bx + 5, hy + 1, 5, 4);
      if (pose === "hitstun") {
        c.fillStyle = "#c1121f";
        c.fillRect(bx - 8, hy + 8, 16, 3);
      }
      // ダメージ点滅
      if (flash > 0) {
        c.fillStyle = `rgba(255,40,40,${Math.min(0.6, flash / 250)})`;
        c.fillRect(bx - 30, topY - 46, 60, 140);
      }
    };

    const render = () => {
      c.save();
      if (g.shake > 0) c.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);

      // 背景（夕暮れ）
      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#2b1a3a");
      grad.addColorStop(0.5, "#7a2f3a");
      grad.addColorStop(1, "#1a1014");
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);
      // 夕日
      c.fillStyle = "rgba(255,180,60,.5)";
      c.beginPath();
      c.arc(W / 2, 250, 120, 0, Math.PI * 2);
      c.fill();
      // 地面
      c.fillStyle = "#15100f";
      c.fillRect(0, GROUND, W, H - GROUND);
      c.strokeStyle = "rgba(255,255,255,.12)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, GROUND);
      c.lineTo(W, GROUND);
      c.stroke();

      // 敵の予備動作テレグラフ
      if (g.ePhase === "windup") {
        const a = 0.3 + 0.4 * Math.abs(Math.sin(g.time * 0.02));
        c.fillStyle = `rgba(193,18,31,${a})`;
        c.beginPath();
        c.arc(EX, GROUND - 150, 70, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ffd60a";
        c.font = "900 40px system-ui";
        c.textAlign = "center";
        c.fillText("⚡", EX, GROUND - 200);
      }

      const pPose = g.guard && g.pPhase === "idle" ? "guard" : g.pPhase;
      drawFighter(PX, 1, "#1b2a4a", "#f2c79a", pPose, g.pLunge, g.flashP);
      // 武器（得物）
      if (g.weaponOn) {
        c.strokeStyle = "#9aa0a6";
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(PX + 30, GROUND - 130);
        c.lineTo(PX + 78, GROUND - 150);
        c.stroke();
      }
      drawFighter(EX, -1, "#5a1020", "#e0b48a", g.ePhase, g.eLunge, g.flashE);

      // HP / 気合
      drawBar(30, 40, 360, g.pHp / g.pHpMax, "#38bdf8", player.name, false);
      drawBar(30, 64, 360, g.kiai / 100, g.kiai >= 100 ? "#ffd60a" : "#f59e0b", "気合", false);
      drawBar(W - 390, 40, 360, g.eHp / g.eHpMax, "#c1121f", `${enemy.name}（${enemy.title}）`, true);

      // コンボ
      if (g.combo >= 2) {
        c.save();
        c.translate(PX - 120, 150);
        c.rotate(-0.08);
        c.fillStyle = "#fff";
        c.strokeStyle = "#0a0908";
        c.lineWidth = 4;
        c.font = "900 52px system-ui";
        c.textAlign = "left";
        c.strokeText(`${g.combo}`, 0, 0);
        c.fillStyle = "#ffd60a";
        c.fillText(`${g.combo}`, 0, 0);
        c.fillStyle = "#fff";
        c.font = "900 22px system-ui";
        c.strokeText("HIT!!", 4, 26);
        c.fillText("HIT!!", 4, 26);
        c.restore();
      }

      // fx
      c.textAlign = "center";
      for (const f of g.fx) {
        const al = Math.min(1, f.life / 250);
        c.save();
        c.globalAlpha = al;
        c.font = `900 ${f.size}px system-ui`;
        c.lineWidth = 4;
        c.strokeStyle = "#0a0908";
        c.strokeText(f.text, f.x, f.y);
        c.fillStyle = f.color;
        c.fillText(f.text, f.x, f.y);
        c.restore();
      }

      // バナー
      if (g.bannerTimer > 0) {
        c.save();
        c.globalAlpha = Math.min(1, g.bannerTimer / 300);
        c.translate(W / 2, 120);
        c.rotate(-0.05);
        c.font = "900 54px system-ui";
        c.textAlign = "center";
        c.lineWidth = 6;
        c.strokeStyle = "#0a0908";
        c.strokeText(g.banner, 0, 0);
        c.fillStyle = "#ffd60a";
        c.fillText(g.banner, 0, 0);
        c.restore();
      }

      // 白フラッシュ
      if (g.flash > 0) {
        c.fillStyle = `rgba(255,255,255,${g.flash})`;
        c.fillRect(0, 0, W, H);
      }

      // 決着
      if (g.result) {
        c.fillStyle = "rgba(10,9,8,.55)";
        c.fillRect(0, 0, W, H);
        c.save();
        c.translate(W / 2, H / 2);
        c.rotate(-0.06);
        c.font = "900 110px system-ui";
        c.textAlign = "center";
        c.lineWidth = 10;
        c.strokeStyle = "#0a0908";
        const txt = g.result === "win" ? "勝 ち！" : "敗 北…";
        c.strokeText(txt, 0, 0);
        c.fillStyle = g.result === "win" ? "#ffd60a" : "#c1121f";
        c.fillText(txt, 0, 0);
        c.restore();
      }

      c.restore();
    };

    // ── loop ──
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      update(dt);
      render();
      if (!finished) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      ctrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hold = (k: "jab" | "strong" | "special") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      ctrlRef.current?.action(k);
    },
  });

  return (
    <div className="min-h-[100dvh] bg-ink text-paper flex flex-col items-center justify-center p-2 select-none no-tap-highlight">
      <div className="w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-auto border-4 border-ink rounded-sm bg-black"
          style={{ imageRendering: "auto", aspectRatio: `${W} / ${H}` }}
        />
        {/* 操作（PC: キーボード / スマホ: ボタン） */}
        <div className="mt-2 grid grid-cols-5 gap-2">
          <button className="btn-knk py-4" {...hold("jab")}>
            J<br />
            <span className="text-[10px]">ジャブ</span>
          </button>
          <button className="btn-knk py-4" {...hold("strong")}>
            K<br />
            <span className="text-[10px]">強打</span>
          </button>
          <button className="btn-knk btn-blood py-4" {...hold("special")}>
            L<br />
            <span className="text-[10px]">必殺</span>
          </button>
          <button
            className="btn-knk btn-dark py-4"
            onPointerDown={(e) => {
              e.preventDefault();
              ctrlRef.current?.setGuard(true);
            }}
            onPointerUp={() => ctrlRef.current?.setGuard(false)}
            onPointerLeave={() => ctrlRef.current?.setGuard(false)}
          >
            ⛊<br />
            <span className="text-[10px]">ガード長押</span>
          </button>
          <button
            className="btn-knk py-4"
            disabled={!hasWeapon}
            onPointerDown={(e) => {
              e.preventDefault();
              ctrlRef.current?.toggleWeapon();
            }}
          >
            W<br />
            <span className="text-[10px]">得物</span>
          </button>
        </div>
        <p className="text-center text-[11px] text-paper/50 mt-2">
          敵の⚡に合わせてガード（ジャストガードで反撃の隙）。気合を溜めてLで必殺だ。
        </p>
      </div>
    </div>
  );
}
