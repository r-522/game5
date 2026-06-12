import { DISTRICTS, ENEMIES, TECHNIQUES } from "./data";
import type {
  BrawlOutcome,
  District,
  DuelContext,
  Enemy,
  PlayerState,
  ResultSummary,
  Technique,
} from "./types";

export const OTOKOGI_MAX = 100;
export const SHABA_THRESHOLD = 20;

// ── 派生ステータス ─────────────────────────────────────────────────────
export const maxHp = (banchoDo: number) => 80 + banchoDo * 20; // Lv1 = 100
export const specialSlots = (banchoDo: number) => Math.min(1 + Math.floor(banchoDo / 3), 3);
export const xpForNext = (banchoDo: number) => 4 + banchoDo * 2;

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function otokogiTier(o: number): { key: string; label: string; note: string } {
  if (o < SHABA_THRESHOLD) return { key: "shaba", label: "シャバ王", note: "街の不良になめられ、店も使えねえ…" };
  if (o < 45) return { key: "hampa", label: "半端者", note: "まだ漢として認められちゃいねえ" };
  if (o < 75) return { key: "bancho", label: "一端の番長", note: "背中で語れる漢になってきた" };
  return { key: "densetsu", label: "伝説の漢", note: "メンチだけで不良がひれ伏す" };
}

// ── ルックアップ ───────────────────────────────────────────────────────
export const getTechnique = (id: string): Technique | undefined => TECHNIQUES.find((t) => t.id === id);
export const getEnemy = (id: string): Enemy | undefined => ENEMIES.find((e) => e.id === id);
export const getDistrict = (key: string): District | undefined => DISTRICTS.find((d) => d.key === key);

export const unlockedFor = (banchoDo: number): string[] =>
  TECHNIQUES.filter((t) => t.reqBanchoDo <= banchoDo).map((t) => t.id);

export function defaultEquipped(unlocked: string[]): string[] {
  const pick = (type: Technique["type"]) =>
    TECHNIQUES.filter((t) => t.type === type && unlocked.includes(t.id));
  const jab = pick("jab")[0];
  const strong = pick("strong")[0];
  const special = pick("special")[0];
  return [jab?.id, strong?.id, special?.id].filter(Boolean) as string[];
}

export function equippedTechniques(player: PlayerState): {
  jab: Technique;
  strong: Technique;
  specials: Technique[];
} {
  const eq = player.equipped.map(getTechnique).filter(Boolean) as Technique[];
  const jab = eq.find((t) => t.type === "jab") ?? (getTechnique("jab_straight") as Technique);
  const strong = eq.find((t) => t.type === "strong") ?? (getTechnique("str_kick") as Technique);
  const specials = eq.filter((t) => t.type === "special");
  return { jab, strong, specials };
}

// ── 新規プレイヤー ─────────────────────────────────────────────────────
export function newPlayer(id: string, name: string): PlayerState {
  const banchoDo = 1;
  const unlocked = unlockedFor(banchoDo);
  return {
    id,
    name: name.trim().slice(0, 12) || "名無しの番長",
    otokogi: 50,
    banchoDo,
    kenkaNare: 0,
    wins: 0,
    unlocked,
    equipped: defaultEquipped(unlocked),
    territories: Object.fromEntries(DISTRICTS.map((d) => [d.key, 0])),
    updatedAt: new Date().toISOString(),
  };
}

/** 旧セーブ / 不正値を安全な形に整える（スキーマ変化に強くする）。 */
export function normalizePlayer(p: Partial<PlayerState> & { id: string; name: string }): PlayerState {
  const banchoDo = clamp(Math.floor(p.banchoDo ?? 1), 1, 99);
  const unlocked = Array.from(new Set([...(p.unlocked ?? []), ...unlockedFor(banchoDo)])).filter(getTechnique);
  const territories: Record<string, number> = {};
  for (const d of DISTRICTS) territories[d.key] = clamp(Math.floor(p.territories?.[d.key] ?? 0), 0, 100);
  let equipped = (p.equipped ?? []).filter((id) => unlocked.includes(id));
  if (!equipped.some((id) => getTechnique(id)?.type === "jab")) equipped = defaultEquipped(unlocked);
  return {
    id: p.id,
    name: (p.name || "名無しの番長").slice(0, 12),
    otokogi: clamp(Math.round(p.otokogi ?? 50), 0, OTOKOGI_MAX),
    banchoDo,
    kenkaNare: Math.max(0, Math.floor(p.kenkaNare ?? 0)),
    wins: Math.max(0, Math.floor(p.wins ?? 0)),
    unlocked,
    equipped,
    territories,
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
}

// ── 縄張りの遭遇ロジック ───────────────────────────────────────────────
const PEACE_PER_MOB = 22;
export const BOSS_PEACE_GATE = 80;

export function nextEncounter(player: PlayerState, districtKey: string): { enemy: Enemy; isBoss: boolean } {
  const d = getDistrict(districtKey)!;
  const peace = player.territories[districtKey] ?? 0;
  if (peace >= BOSS_PEACE_GATE) {
    return { enemy: getEnemy(d.boss)!, isBoss: true };
  }
  const pool = d.mobs;
  const enemyId = pool[Math.floor(Math.random() * pool.length)];
  return { enemy: getEnemy(enemyId)!, isBoss: false };
}

export function isDistrictUnlocked(player: PlayerState, d: District): boolean {
  return player.banchoDo >= d.reqBanchoDo;
}

export function allCleared(player: PlayerState): boolean {
  return DISTRICTS.every((d) => (player.territories[d.key] ?? 0) >= 100);
}

// ── メンチビーム ───────────────────────────────────────────────────────
/** 男気が高いほどメンチビームが強い（不変システム：威圧の源泉は男気）。 */
export const menchiPower = (player: PlayerState) => 1 + player.otokogi / 100;

/** メンチビームの調整値。pos は 0..100 のせめぎ合い位置（50 が中央）。 */
export const MENCHI = {
  DURATION_MS: 4500,
  WIN_POS: 82, // ここまで押し込めばメンチ勝ち
  LOSE_POS: 18, // ここまで押し返されたら睨み負け
  RESULT_DELAY_MS: 700,
};

/** 連打1回で押し込む量。 */
export const menchiTapPush = (player: PlayerState) => 5.5 * menchiPower(player);

/** 相手が押し返してくる速さ（pos/秒）。手が早い相手ほど強い。 */
export const menchiEnemyRate = (enemy: Enemy, isBoss: boolean) =>
  (isBoss ? 17 : 11) + enemy.power * 0.5;

// ── タンカバトル ───────────────────────────────────────────────────────
export const TANKA = {
  DURATION_MS: 6000,
  RESULT_DELAY_MS: 950,
};

// ── 勝敗を状態に反映 ───────────────────────────────────────────────────
export function applyDuelResult(
  player: PlayerState,
  ctx: DuelContext,
  outcome: BrawlOutcome,
): ResultSummary {
  const messages: string[] = [];
  const peaceBefore = player.territories[ctx.districtKey] ?? 0;
  let otokogiDelta = 0;

  if (!outcome.win) {
    otokogiDelta = -2;
    const next: PlayerState = {
      ...player,
      otokogi: clamp(player.otokogi + otokogiDelta, 0, OTOKOGI_MAX),
      kenkaNare: player.kenkaNare + 1,
      updatedAt: new Date().toISOString(),
    };
    messages.push("ボロ負けだ…だが、痛みは喧嘩慣れになる。出直しな。");
    return {
      player: next, win: false, otokogiDelta, kenkaNareGain: 1, leveledUp: false,
      newTechniques: [], peaceBefore, peaceAfter: peaceBefore, districtCleared: false,
      allCleared: allCleared(player), messages,
    };
  }

  // ── 勝利時の男気増減（不変システム：正々堂々で上がり、シャバい手で下がる） ──
  otokogiDelta += 6;
  if (ctx.cheapShot) {
    otokogiDelta -= 18;
    messages.push("不意打ちで勝っても、漢は1ミリも上がらねえ。");
  } else {
    if (ctx.menchiWon) otokogiDelta += 2;
    if (ctx.firstStrike === "player") otokogiDelta += 4;
    if (ctx.tankaUra) {
      otokogiDelta += 4;
      messages.push("粋なタンカが決まった。相手も惚れ直したぜ。");
    }
  }
  if (outcome.usedWeapon) {
    otokogiDelta -= 12;
    messages.push("武器に頼っちゃあ、所詮はシャバいケンカよ。");
  }
  if (outcome.specials > 0) otokogiDelta += Math.min(outcome.specials, 3);
  otokogiDelta += Math.min(Math.floor(outcome.maxCombo / 5), 4);
  otokogiDelta += Math.min(outcome.perfectGuards, 3);
  if (ctx.isBoss) otokogiDelta += 10;
  if (outcome.hpRatio > 0.7 && !outcome.usedWeapon) {
    otokogiDelta += 3;
    messages.push("ほぼ無傷の完勝。格が違うってやつだ。");
  }

  const newOtokogi = clamp(player.otokogi + otokogiDelta, 0, OTOKOGI_MAX);

  // ── 喧嘩慣れ度・番長度 ──
  const kenkaNareGain = 2 + (ctx.isBoss ? 4 : 0) + Math.floor(outcome.maxCombo / 4);
  let banchoDo = player.banchoDo;
  let kenkaNare = player.kenkaNare + kenkaNareGain;
  let leveledUp = false;
  const prevUnlocked = new Set(player.unlocked);
  while (kenkaNare >= xpForNext(banchoDo)) {
    kenkaNare -= xpForNext(banchoDo);
    banchoDo += 1;
    leveledUp = true;
  }
  const unlocked = Array.from(new Set([...player.unlocked, ...unlockedFor(banchoDo)]));
  const newTechniques = unlocked.filter((id) => !prevUnlocked.has(id)).map(getTechnique).filter(Boolean) as Technique[];

  // 新しい必殺を自動で空きスロットに装備
  let equipped = [...player.equipped];
  for (const t of newTechniques) {
    if (t.type === "special") {
      const equippedSpecials = equipped.map(getTechnique).filter((x) => x?.type === "special").length;
      if (equippedSpecials < specialSlots(banchoDo)) equipped.push(t.id);
    }
  }
  if (leveledUp) messages.push(`喧嘩慣れが極まり、番長度が ${banchoDo} に上がった！`);
  for (const t of newTechniques) messages.push(`新たな技を体得：「${t.name}」`);

  // ── 縄張りの平和度 ──
  let peaceAfter = peaceBefore;
  let districtCleared = false;
  if (ctx.isBoss) {
    peaceAfter = 100;
    districtCleared = true;
    const d = getDistrict(ctx.districtKey)!;
    messages.push(`${d.name} を完全に制圧した！この縄張りに平和が戻った。`);
  } else {
    peaceAfter = clamp(peaceBefore + PEACE_PER_MOB, 0, 99); // ボスはゲートの先
    if (peaceAfter >= BOSS_PEACE_GATE) messages.push("縄張りがざわついてる。ここの番長が出てくるぞ…！");
  }

  const territories = { ...player.territories, [ctx.districtKey]: peaceAfter };

  const next: PlayerState = {
    ...player,
    otokogi: newOtokogi,
    banchoDo,
    kenkaNare,
    wins: player.wins + 1,
    unlocked,
    equipped,
    territories,
    updatedAt: new Date().toISOString(),
  };

  return {
    player: next,
    win: true,
    otokogiDelta,
    kenkaNareGain,
    leveledUp,
    newTechniques,
    peaceBefore,
    peaceAfter,
    districtCleared,
    allCleared: allCleared(next),
    messages,
  };
}
