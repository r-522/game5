import type { District, Enemy, Provocation, Technique } from "./types";

// ── 技（技装備の対象） ──────────────────────────────────────────────────
export const TECHNIQUES: Technique[] = [
  // jab
  { id: "jab_straight", name: "正調・右ストレート", type: "jab", damage: 9, kiaiGain: 12, kiaiCost: 0, reqBanchoDo: 1, windupMs: 110, recoverMs: 190, desc: "基本にして奥義。素早く突き出す右。" },
  { id: "jab_rush", name: "シャカリキ連打", type: "jab", damage: 7, kiaiGain: 15, kiaiCost: 0, reqBanchoDo: 2, windupMs: 90, recoverMs: 160, desc: "気合だけで押し込むラッシュ。気合の溜まりが早い。" },
  { id: "jab_elbow", name: "カチ上げ肘", type: "jab", damage: 12, kiaiGain: 13, kiaiCost: 0, reqBanchoDo: 4, windupMs: 130, recoverMs: 210, desc: "顎を撃ち抜く肘打ち。地味に痛え。" },

  // strong
  { id: "str_kick", name: "回し蹴り", type: "strong", damage: 18, kiaiGain: 17, kiaiCost: 0, reqBanchoDo: 1, windupMs: 250, recoverMs: 420, desc: "腰の入った一撃。隙はデカい。" },
  { id: "str_hook", name: "渾身のフック", type: "strong", damage: 23, kiaiGain: 19, kiaiCost: 0, reqBanchoDo: 3, windupMs: 280, recoverMs: 460, desc: "体重を乗せた鉤突き。当たればデカい。" },
  { id: "str_headbutt", name: "脳天かちわり頭突き", type: "strong", damage: 28, kiaiGain: 22, kiaiCost: 0, reqBanchoDo: 5, windupMs: 320, recoverMs: 520, desc: "番長の挨拶。痛いのはお互い様だ。" },

  // special（必殺）
  { id: "sp_banchopunch", name: "番長パンチ", type: "special", damage: 42, kiaiGain: 0, kiaiCost: 40, reqBanchoDo: 1, windupMs: 340, recoverMs: 480, desc: "魂を込めた一発。気合40消費。" },
  { id: "sp_souldrive", name: "ソウル＆ブラッド", type: "special", damage: 62, kiaiGain: 0, kiaiCost: 65, reqBanchoDo: 3, windupMs: 380, recoverMs: 520, desc: "血と魂の連撃。気合65消費。" },
  { id: "sp_lastbancho", name: "最後の番長・極", type: "special", damage: 95, kiaiGain: 0, kiaiCost: 100, reqBanchoDo: 6, windupMs: 420, recoverMs: 560, desc: "滅びゆく番長道の集大成。気合MAXで放つ奥義。" },
];

// ── タンカ（共通プール） ───────────────────────────────────────────────
const GENERIC_PROVOCATIONS: Provocation[] = [
  {
    taunt: "あぁん？ どこ中だテメェ！",
    options: [
      { text: "うるせえ、表出ろや", correct: true },
      { text: "す、すみませんっした！", correct: false },
      { text: "（そっと目をそらす）", correct: false },
    ],
  },
  {
    taunt: "ここはオレらの縄張りだ、シャバいガキは帰んな！",
    options: [
      { text: "縄張り？ 今日でテメエの代は終わりだ", correct: true, ura: true },
      { text: "知らずに入ってごめんなさい", correct: false },
      { text: "じゃあ帰ります…", correct: false },
    ],
  },
  {
    taunt: "おいおい、ビビって声も出ねえのか？",
    options: [
      { text: "黙って拳で聞けや", correct: true },
      { text: "ビ、ビビってないし！", correct: false },
      { text: "声は…出ます…", correct: false },
    ],
  },
  {
    taunt: "親の顔が見てみてえもんだなァ！",
    options: [
      { text: "オレの背中に親の顔が見えるか？", correct: true, ura: true },
      { text: "親は関係ないだろ！", correct: false },
      { text: "母さん…", correct: false },
    ],
  },
  {
    taunt: "今ならまだ間に合うぜ、土下座すりゃ許してやる",
    options: [
      { text: "その台詞、そっくり返すぜ", correct: true },
      { text: "じゃ、じゃあ土下座で…", correct: false },
      { text: "許してくれるんですか？", correct: false },
    ],
  },
];

const provoke = (...idx: number[]): Provocation[] => idx.map((i) => GENERIC_PROVOCATIONS[i]);

// ── 敵 ─────────────────────────────────────────────────────────────────
export const ENEMIES: Enemy[] = [
  // mobs
  { id: "chinpira", name: "チンピラ", title: "駅前のチンピラ", maxHp: 60, power: 7, attackMs: 1600, windupMs: 620, provocations: provoke(0, 2), bark: "い、いてててて…" },
  { id: "zoku", name: "暴れん坊", title: "改造単車の暴れん坊", maxHp: 82, power: 9, attackMs: 1420, windupMs: 560, provocations: provoke(2, 4), bark: "オレの単車がぁ…！" },
  { id: "karateka", name: "元・空手部", title: "型破りの拳", maxHp: 98, power: 11, attackMs: 1260, windupMs: 520, provocations: provoke(0, 4), bark: "押忍…まいった…" },
  { id: "kage", name: "廃校の影", title: "亡霊番長", maxHp: 112, power: 12, attackMs: 1160, windupMs: 500, provocations: provoke(1, 2), bark: "また…眠りにつくか…" },
  { id: "gang", name: "半グレ", title: "令和の半グレ", maxHp: 124, power: 13, attackMs: 1080, windupMs: 480, provocations: provoke(1, 4), bark: "SNSに晒してやる…って無理か…" },

  // bosses
  {
    id: "boss_ekimae", name: "鬼山", title: "駅前番長", maxHp: 150, power: 12, attackMs: 1200, windupMs: 540, isBoss: true,
    bark: "テメエ…いい目してやがる…", provocations: [
      { taunt: "シャッター街にも掟ってもんがあんだよ、坊主！", options: [
        { text: "掟は今日からオレが書き換える", correct: true, ura: true },
        { text: "掟なんて知らないし", correct: false },
        { text: "ご指導お願いします", correct: false },
      ] },
      ...provoke(2),
    ],
  },
  {
    id: "boss_dote", name: "般若の竜", title: "土手の主", maxHp: 192, power: 14, attackMs: 1120, windupMs: 520, isBoss: true,
    bark: "夕日を背にすんのはオレの役だぜ", provocations: [
      { taunt: "この土手で何人沈めたか、数えてやろうか？", options: [
        { text: "今日でその数、止まるけどな", correct: true, ura: true },
        { text: "何人ですか…？", correct: false },
        { text: "沈めないでください", correct: false },
      ] },
      ...provoke(4),
    ],
  },
  {
    id: "boss_kyuukousha", name: "修羅", title: "八つ裂きの修羅", maxHp: 232, power: 16, attackMs: 1040, windupMs: 500, isBoss: true,
    bark: "この廃校が…オレの墓場だ", provocations: [
      { taunt: "番長なんてもう流行らねえ。お前も滅びる側だ！", options: [
        { text: "滅びる美学ってのも、悪かねえ", correct: true, ura: true },
        { text: "流行ってほしい…", correct: false },
        { text: "じゃあ滅びます", correct: false },
      ] },
      ...provoke(1),
    ],
  },
  {
    id: "boss_geesen", name: "ジャック堂島", title: "ネオンの帝王", maxHp: 272, power: 17, attackMs: 980, windupMs: 480, isBoss: true,
    bark: "札束で頬を張る時代に、拳かよ古いねェ", provocations: [
      { taunt: "金も人脈もねえお前が、何を賭けて殴るってんだ？", options: [
        { text: "賭けるのは意地だ。それで充分だろ", correct: true, ura: true },
        { text: "お金…欲しいです", correct: false },
        { text: "人脈ください", correct: false },
      ] },
      ...provoke(0),
    ],
  },
  {
    id: "boss_okujou", name: "???", title: "最後の番長", maxHp: 340, power: 19, attackMs: 920, windupMs: 470, isBoss: true,
    bark: "ここまで来たか。なら——本気で潰す", provocations: [
      { taunt: "番長が消えた街で、お前はなぜまだ拳を握る？", options: [
        { text: "誰かが最後まで、漢を張らなきゃならねえ", correct: true, ura: true },
        { text: "なんとなく…です", correct: false },
        { text: "もう握りたくないかも", correct: false },
      ] },
      { taunt: "その男気、本物か試させてもらうぜ！", options: [
        { text: "見せてやる、これが番長道だ", correct: true },
        { text: "自信は…ないです", correct: false },
        { text: "偽物かもしれません", correct: false },
      ] },
    ],
  },
];

// ── 縄張り（箱庭マップ） ───────────────────────────────────────────────
export const DISTRICTS: District[] = [
  {
    key: "ekimae", name: "駅前シャッター街", subtitle: "閉じた商店街の掟",
    reqBanchoDo: 1, mobs: ["chinpira", "zoku"], boss: "boss_ekimae", hasWeapons: false,
    intro: "シャッターの降りた商店街。かつての賑わいは消え、残ったのは半端な不良どもだけだ。",
  },
  {
    key: "dote", name: "河川敷の土手", subtitle: "夕焼けタイマン通り",
    reqBanchoDo: 2, mobs: ["zoku", "karateka"], boss: "boss_dote", hasWeapons: true,
    intro: "夕日に焼ける土手。ここは昔からタイマンの聖地——逃げ場はねえ。",
  },
  {
    key: "kyuukousha", name: "廃校・第三校舎", subtitle: "亡霊番長の巣",
    reqBanchoDo: 3, mobs: ["karateka", "kage"], boss: "boss_kyuukousha", hasWeapons: true,
    intro: "取り壊しを待つ廃校。割れた窓の奥で、滅びた番長たちの魂がまだ燻ってる。",
  },
  {
    key: "geesen", name: "ネオン裏ゲーセン横丁", subtitle: "令和の帝王",
    reqBanchoDo: 4, mobs: ["kage", "gang"], boss: "boss_geesen", hasWeapons: true,
    intro: "ケバいネオンの裏路地。金と数で殴ってくる、新しいタイプの悪さ。",
  },
  {
    key: "okujou", name: "旧校舎・屋上", subtitle: "最後の番長",
    reqBanchoDo: 5, mobs: ["gang"], boss: "boss_okujou", hasWeapons: false,
    intro: "錆びたフェンスの向こう、空に一番近い決闘場。ここに、最後の番長が立っている。",
  },
];

// ── ナレーション（昭和の不良映画オマージュ） ──────────────────────────
export const NARRATION = {
  title: [
    "——番長が、絶滅したと言われる時代。",
    "拳より先に画面が殴り合い、漢気は“ダサい”の一言で葬られた。",
    "そんな令和の片隅に、たった一人。",
    "時代遅れを承知で、まだメンチを切る男がいた。",
  ],
  clear: [
    "全ての縄張りが、静かになった。",
    "番長のいた時代を、誰も覚えちゃいないだろう。",
    "それでもお前は、最後まで漢を張り通した。",
    "——これにて、最後の番長の物語、一件落着。",
  ],
  shabaWarning: "男気が地に落ちてやがる。このままじゃ“シャバ王”だ、街中の笑いもんだぜ。",
};

export const STORAGE_KEY = "knk_player_v1";
export const PLAYER_ID_KEY = "knk_player_id";
