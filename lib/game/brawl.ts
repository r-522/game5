// ── 喧嘩（タイマン）シミュレーション ───────────────────────────────────
// Canvas/DOM を含まない純ロジック。男気に響く数値（武器補正・ジャストガード等）
// を含む戦闘バランスはすべてこのファイルに集約する。
// 描画は components/brawl/render.ts、入力と React 接続は components/Brawl.tsx。

import { equippedTechniques, maxHp } from "./engine";
import type { BrawlOutcome, DuelContext, Enemy, PlayerState, Technique } from "./types";

// ── 画面座標（シミュレーションが FX を置く座標系。描画側も共有） ──────
export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 430;
export const PLAYER_X = 300;
export const ENEMY_X = 660;

// ── 戦闘バランス定数 ───────────────────────────────────────────────────
const PLAYER_HITSTUN_MS = 420; // 被弾後の硬直
const PERFECT_GUARD_MS = 160; // ガード開始からこの時間内ならジャストガード
const ENEMY_RECOVER_MS = 450; // 敵の攻撃後の硬直
const ENEMY_HITSTUN_MS = 320; // 必殺・ジャストガードで敵がのけぞる時間
const END_DELAY_MS = 1500; // 決着演出から結果画面までの間
const WEAPON_MULT = 1.6; // 得物使用時のダメージ倍率（男気は下がる）
const COMBO_DMG_STEP = 0.03; // コンボ1つあたりのダメージ上昇
const COMBO_DMG_CAP = 10; // ダメージ上昇に数えるコンボの上限
const COMBO_WINDOW_MS = 1200; // コンボ継続の猶予
const GUARD_CHIP = 0.25; // 通常ガード時に通るダメージ割合
const GUARD_KIAI = 6; // 通常ガード成功の気合
const PERFECT_GUARD_KIAI = 18; // ジャストガードの気合
const MENCHI_WIN_KIAI = 20; // メンチ勝ちで気合を持ち越す

// ── 効果音テキスト（FX として状態に積まれる） ──────────────────────────
const ONO = {
  jab: ["バッ", "スパッ", "ピシッ", "タッ"],
  strong: ["ドゴォ！", "バキィ！", "ゴッ！", "ズバッ！"],
  special: ["ズドーン！！", "轟ッ！！", "ぬぅんっ！！"],
  enemy: ["グハッ", "ゴッ", "ガッ", "うぐっ"],
  guard: ["ガキィン", "ギャリッ"],
  perfect: ["ジャストガード！"],
};
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export type AttackKind = "jab" | "strong" | "special";
export type PlayerPhase = "idle" | "attack" | "hitstun" | "down";
export type EnemyPhase = "idle" | "windup" | "strike" | "recover" | "hitstun" | "down";

export interface Fx {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
}

export interface BrawlState {
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
  pPhase: PlayerPhase;
  pTimer: number;
  atk: { tech: Technique; t: number; windup: number; recover: number; hit: boolean } | null;
  guard: boolean;
  guardStart: number;
  pLunge: number;
  eLunge: number;
  ePhase: EnemyPhase;
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

export interface Brawl {
  /** 描画用に公開する内部状態（書き換えは update / 各操作経由のみ） */
  g: BrawlState;
  /** 1フレーム進める。決着演出が終わったフレームで結果を返す。 */
  update(dt: number): BrawlOutcome | null;
  action(kind: AttackKind): void;
  setGuard(v: boolean): void;
  toggleWeapon(): void;
}

export function createBrawl(
  player: PlayerState,
  enemy: Enemy,
  ctx: DuelContext,
  hasWeapon: boolean,
): Brawl {
  const tech = equippedTechniques(player);
  const eInterval = enemy.attackMs;
  const eWindup = enemy.windupMs;

  const g: BrawlState = {
    pHp: maxHp(player.banchoDo),
    pHpMax: maxHp(player.banchoDo),
    eHp: enemy.maxHp,
    eHpMax: enemy.maxHp,
    kiai: ctx.menchiWon ? MENCHI_WIN_KIAI : 0,
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
    const mult = (g.weaponOn ? WEAPON_MULT : 1) * (1 + Math.min(g.combo, COMBO_DMG_CAP) * COMBO_DMG_STEP);
    const dmg = t.damage * mult;
    g.eHp -= dmg;
    if (g.weaponOn) g.usedWeapon = true;
    g.combo += 1;
    g.comboTimer = COMBO_WINDOW_MS;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    if (t.type !== "special") g.kiai = Math.min(100, g.kiai + t.kiaiGain);
    g.flashE = 120;
    const ono = t.type === "special" ? pick(ONO.special) : t.type === "strong" ? pick(ONO.strong) : pick(ONO.jab);
    spawnFx(ENEMY_X - 20, GROUND_Y - 150, ono, t.type === "jab" ? "#fff" : "#ffd60a", t.type === "special" ? 64 : t.type === "strong" ? 46 : 32);
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
      spawnFx(ENEMY_X, GROUND_Y - 180, "K.O.!!", "#c1121f", 80);
    }
  };

  const action = (kind: AttackKind) => {
    if (g.result || g.pPhase === "hitstun" || g.pPhase === "down" || g.pPhase === "attack") return;
    let t: Technique | undefined;
    if (kind === "jab") t = tech.jab;
    else if (kind === "strong") t = tech.strong;
    else {
      const affordable = tech.specials.filter((s) => g.kiai >= s.kiaiCost).sort((a, b) => b.kiaiCost - a.kiaiCost);
      t = affordable[0];
      if (!t) {
        spawnFx(PLAYER_X, GROUND_Y - 200, "気合不足！", "#38bdf8", 28);
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
      if (gdur <= PERFECT_GUARD_MS) {
        g.perfectGuards += 1;
        g.kiai = Math.min(100, g.kiai + PERFECT_GUARD_KIAI);
        g.ePhase = "hitstun";
        g.eTimer = 0;
        g.eLunge = -20;
        spawnFx(PLAYER_X, GROUND_Y - 210, pick(ONO.perfect), "#ffd60a", 40);
        g.flash = 0.35;
        g.shake = Math.max(g.shake, 6);
        return;
      }
      g.pHp -= enemy.power * GUARD_CHIP;
      g.kiai = Math.min(100, g.kiai + GUARD_KIAI);
      spawnFx(PLAYER_X, GROUND_Y - 160, pick(ONO.guard), "#cbd5e1", 30);
    } else {
      g.pHp -= enemy.power;
      g.pPhase = "hitstun";
      g.pTimer = 0;
      g.atk = null;
      g.combo = 0;
      g.flashP = 150;
      g.shake = Math.max(g.shake, 10);
      spawnFx(PLAYER_X, GROUND_Y - 150, pick(ONO.enemy), "#fff", 40);
      if (g.pHp <= 0) {
        g.pHp = 0;
        g.pPhase = "down";
        g.result = "lose";
        g.endTimer = 0;
        spawnFx(PLAYER_X, GROUND_Y - 180, "ダウン…", "#c1121f", 64);
      }
    }
  };

  const outcome = (): BrawlOutcome => ({
    win: g.result === "win",
    maxCombo: g.maxCombo,
    usedWeapon: g.usedWeapon,
    specials: g.specials,
    hpRatio: Math.max(0, g.pHp) / g.pHpMax,
    perfectGuards: g.perfectGuards,
  });

  const update = (dt: number): BrawlOutcome | null => {
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
      return g.endTimer >= END_DELAY_MS ? outcome() : null;
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
      if (g.pTimer >= PLAYER_HITSTUN_MS) g.pPhase = "idle";
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
        if (g.eTimer >= ENEMY_RECOVER_MS) {
          g.ePhase = "idle";
          g.eTimer = 0;
          g.eNext = eInterval * (0.7 + Math.random() * 0.4);
        }
      } else if (g.ePhase === "hitstun") {
        if (g.eTimer >= ENEMY_HITSTUN_MS) {
          g.ePhase = "idle";
          g.eTimer = 0;
          g.eNext = eInterval * 0.5;
        }
      }
    }
    return null;
  };

  return {
    g,
    update,
    action,
    setGuard(v: boolean) {
      if (v && !g.guard && g.pPhase === "idle") g.guardStart = g.time;
      g.guard = v;
    },
    toggleWeapon() {
      if (g.weaponAvail) g.weaponOn = !g.weaponOn;
    },
  };
}
