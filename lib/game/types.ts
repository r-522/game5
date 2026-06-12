// ── Core domain types for 喧嘩番長7 ─────────────────────────────────────
// The "immutable systems" of the series live here as first-class data:
//   メンチビーム / タンカバトル / 男気(otokogi) / 縄張りの平和度(peace) /
//   番長度(banchoDo) & 喧嘩慣れ度(kenkaNare).

export type TechniqueType = "jab" | "strong" | "special";

export interface Technique {
  id: string;
  name: string;
  type: TechniqueType;
  damage: number;
  kiaiGain: number; // 気合ゲージの上昇量（命中時）
  kiaiCost: number; // 必殺技の消費量（jab/strong は 0）
  reqBanchoDo: number; // 解放に必要な番長度
  windupMs: number; // 発生（隙の前半）
  recoverMs: number; // 硬直（この間は無防備）
  desc: string;
}

export interface TankaOption {
  text: string;
  correct: boolean;
  ura?: boolean; // 裏正解：より粋な切り返し
}

export interface Provocation {
  taunt: string; // 相手の煽り
  options: TankaOption[];
}

export interface Enemy {
  id: string;
  name: string;
  title: string; // 異名
  maxHp: number;
  power: number; // 1撃のダメージ
  attackMs: number; // 攻撃間隔（小さいほど手が早い）
  windupMs: number; // 予備動作の長さ（大きいほどガードしやすい）
  isBoss?: boolean;
  provocations: Provocation[];
  bark?: string; // 遭遇 / KO時の一言
}

export interface District {
  key: string;
  name: string;
  subtitle: string;
  reqBanchoDo: number; // 解放に必要な番長度
  mobs: string[]; // 雑魚 enemy id
  boss: string; // ボス enemy id
  hasWeapons: boolean; // 武器が落ちている縄張りか
  intro: string; // 突入時のナレーション
}

export interface PlayerState {
  id: string;
  name: string;
  otokogi: number; // 男気 0..100
  banchoDo: number; // 番長度 1..
  kenkaNare: number; // 喧嘩慣れ度（次のレベルまでの経験値）
  wins: number;
  equipped: string[]; // 装備中の技 id
  unlocked: string[]; // 解放済みの技 id
  territories: Record<string, number>; // districtKey -> peace 0..100
  updatedAt: string;
}

export interface BrawlOutcome {
  win: boolean;
  maxCombo: number;
  usedWeapon: boolean;
  specials: number; // 必殺を当てた回数
  hpRatio: number; // 残りHP割合 0..1
  perfectGuards: number; // ジャストガード成功数
}

export interface DuelContext {
  districtKey: string;
  enemyId: string;
  isBoss: boolean;
  cheapShot: boolean; // 不意打ちを選んだか
  menchiWon: boolean | null;
  firstStrike: "player" | "enemy" | null; // タンカ/不意打ちの結果
  tankaUra: boolean; // 裏正解を出したか
}

export interface ResultSummary {
  player: PlayerState; // 反映後の状態
  win: boolean;
  otokogiDelta: number;
  kenkaNareGain: number;
  leveledUp: boolean;
  newTechniques: Technique[];
  peaceBefore: number;
  peaceAfter: number;
  districtCleared: boolean;
  allCleared: boolean;
  messages: string[];
}

export interface RankRow {
  id: string;
  name: string;
  bancho_do: number;
  otokogi: number;
  wins: number;
}
