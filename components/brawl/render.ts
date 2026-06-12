// ── 喧嘩画面の Canvas 描画 ─────────────────────────────────────────────
// BrawlState（lib/game/brawl.ts）を読み取って描くだけ。状態は一切変更しない。

import {
  ENEMY_X,
  GROUND_Y,
  PLAYER_X,
  VIEW_H,
  VIEW_W,
  type BrawlState,
  type EnemyPhase,
  type PlayerPhase,
} from "@/lib/game/brawl";

type Pose = PlayerPhase | EnemyPhase | "guard";

function drawBar(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  ratio: number,
  color: string,
  label: string,
  right: boolean,
) {
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
}

function drawFighter(
  c: CanvasRenderingContext2D,
  x: number,
  dir: 1 | -1,
  gakuran: string,
  skin: string,
  pose: Pose,
  lunge: number,
  flash: number,
) {
  const bx = x + lunge * dir;
  // 影
  c.fillStyle = "rgba(0,0,0,.35)";
  c.beginPath();
  c.ellipse(x, GROUND_Y + 10, 46, 12, 0, 0, Math.PI * 2);
  c.fill();

  if (pose === "down") {
    c.save();
    c.translate(bx, GROUND_Y - 20);
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

  const topY = GROUND_Y - 150;
  // 脚
  c.fillStyle = "#11151f";
  c.fillRect(bx - 20, GROUND_Y - 70, 16, 70);
  c.fillRect(bx + 6, GROUND_Y - 70, 16, 70);
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
}

export function renderBrawl(
  c: CanvasRenderingContext2D,
  g: BrawlState,
  playerName: string,
  enemyLabel: string,
) {
  c.save();
  if (g.shake > 0) c.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);

  // 背景（夕暮れ）
  const grad = c.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, "#2b1a3a");
  grad.addColorStop(0.5, "#7a2f3a");
  grad.addColorStop(1, "#1a1014");
  c.fillStyle = grad;
  c.fillRect(0, 0, VIEW_W, VIEW_H);
  // 夕日
  c.fillStyle = "rgba(255,180,60,.5)";
  c.beginPath();
  c.arc(VIEW_W / 2, 250, 120, 0, Math.PI * 2);
  c.fill();
  // 地面
  c.fillStyle = "#15100f";
  c.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  c.strokeStyle = "rgba(255,255,255,.12)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, GROUND_Y);
  c.lineTo(VIEW_W, GROUND_Y);
  c.stroke();

  // 敵の予備動作テレグラフ
  if (g.ePhase === "windup") {
    const a = 0.3 + 0.4 * Math.abs(Math.sin(g.time * 0.02));
    c.fillStyle = `rgba(193,18,31,${a})`;
    c.beginPath();
    c.arc(ENEMY_X, GROUND_Y - 150, 70, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffd60a";
    c.font = "900 40px system-ui";
    c.textAlign = "center";
    c.fillText("⚡", ENEMY_X, GROUND_Y - 200);
  }

  const pPose = g.guard && g.pPhase === "idle" ? "guard" : g.pPhase;
  drawFighter(c, PLAYER_X, 1, "#1b2a4a", "#f2c79a", pPose, g.pLunge, g.flashP);
  // 武器（得物）
  if (g.weaponOn) {
    c.strokeStyle = "#9aa0a6";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(PLAYER_X + 30, GROUND_Y - 130);
    c.lineTo(PLAYER_X + 78, GROUND_Y - 150);
    c.stroke();
  }
  drawFighter(c, ENEMY_X, -1, "#5a1020", "#e0b48a", g.ePhase, g.eLunge, g.flashE);

  // HP / 気合
  drawBar(c, 30, 40, 360, g.pHp / g.pHpMax, "#38bdf8", playerName, false);
  drawBar(c, 30, 64, 360, g.kiai / 100, g.kiai >= 100 ? "#ffd60a" : "#f59e0b", "気合", false);
  drawBar(c, VIEW_W - 390, 40, 360, g.eHp / g.eHpMax, "#c1121f", enemyLabel, true);

  // コンボ
  if (g.combo >= 2) {
    c.save();
    c.translate(PLAYER_X - 120, 150);
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
    c.translate(VIEW_W / 2, 120);
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
    c.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // 決着
  if (g.result) {
    c.fillStyle = "rgba(10,9,8,.55)";
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.save();
    c.translate(VIEW_W / 2, VIEW_H / 2);
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
}
