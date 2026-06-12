# 喧嘩番長7 ―最後の番長― (KENKA BANCHO 7: The Last Banchо)

> 番長が絶滅したと言われる令和に、たった一人の「時代遅れ」が拳を握る。
> シリーズの**不変システム**（メンチビーム／タンカバトル／男気／縄張りの平和度）はそのまま、
> 携帯機に縛られて途絶えた本編を、**ブラウザ＝全プラットフォーム同時**という後継形で甦らせる試み。

Next.js (App Router) + TypeScript + Canvas 製のブラウザ・アクションADV。
**Supabase 未設定でもそのまま遊べます**（localStorage に自動フォールバック）。Vercel デプロイ前提。

---

## なぜ「Web」なのか（コンセプト）

本編は『6』(2015, 3DS) を最後に10年以上途絶えた。シリーズの弱点は **PSP→3DS と“死にゆく携帯機”に依存し続けたこと**。
そこで KB7 はあえてプラットフォーム非依存の **Web** で作る ＝ Switch でも PC でもスマホでも、URL ひとつで殴り込める。
これが「7 にふさわしい後継の形」という設計判断です。

### 不変システムの実装対応表

| シリーズの核 | 本実装での対応 | 場所 |
|---|---|---|
| メンチビーム | 連打で光線のせめぎ合いを相手へ押し返すミニゲーム（男気が高いほど強い） | `components/Menchi.tsx` |
| タンカバトル | 制限時間内に正しい啖呵を選び先制攻撃。**裏正解**で完全先制 | `components/Tanka.tsx` |
| 男気システム | 正々堂々で上昇／不意打ち・武器・トドメ過剰で低下。`20`未満で**シャバ王**化 | `lib/game/engine.ts` |
| 縄張りの平和度 | 各エリアの平和度%を喧嘩で浄化。80%でボス（番長）出現、撃破で制圧 | `lib/game/engine.ts`, `components/WorldMap.tsx` |
| 番長度・喧嘩慣れ度 | 勝利で喧嘩慣れ度→番長度が上がり、技解放・体力上昇・エリア解放 | `lib/game/engine.ts` |
| 技装備 | ジャブ／強打／必殺を装備。番長度で必殺スロット増 | `components/Loadout.tsx` |
| 昭和の不良映画トーン | ナレーション・タンカ・KO演出・夕焼けタイマン場 | `lib/game/data.ts` ほか |

---

## ローカルで動かす

前提: **Node.js 18 以上**（推奨 20/22/24 LTS）。

```bash
npm install
npm run dev      # http://localhost:3000
# 本番ビルド確認
npm run build && npm run start
```

操作: **J=ジャブ / K=強打 / L=必殺 / Space(またはF)=ガード長押し / W=得物**（スマホは画面下のボタン）。
敵の ⚡（予備動作）に合わせてガード、ジャストガードで反撃の隙が生まれる。気合を溜めて L で必殺。

---

## Supabase 連携（任意・クラウドセーブ＆全国ランキング）

未設定なら自動で localStorage 保存になります。クラウド化する場合のみ:

1. [Supabase](https://supabase.com/) でプロジェクト作成。
2. **SQL Editor** に [`supabase/schema.sql`](./supabase/schema.sql) を貼って実行（テーブルは全て `knk_` 接頭辞: `knk_players` とビュー `knk_ranking`）。
3. **Project Settings → API** から URL と **service_role** キーを取得し、`.env.local` を作成:

   ```bash
   # .env.local （.env.example をコピー）
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
   ```

   > service_role キーはサーバ専用。`NEXT_PUBLIC_` を**付けない**こと（ブラウザに漏らさない）。
   > 読み書きはすべて Route Handler（`app/api/*`）がサーバ側で行い、RLS を貫通します。

---

## Vercel へデプロイ

1. このディレクトリを Git リポジトリにして GitHub などへ push。
2. [Vercel](https://vercel.com/) で **Import Project**（Framework は自動で Next.js を検出）。
3. （Supabase を使う場合）**Settings → Environment Variables** に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を登録。
4. **Deploy**。以降は push で自動デプロイ。

特別な設定ファイルは不要（標準の Next.js プロジェクトとして動きます）。

---

## ディレクトリ構成

```
app/
  layout.tsx, globals.css      … ルート/スタイル（昭和漫画トーン）
  page.tsx                     … 画面遷移ステートマシン（タイトル→マップ→決闘→結果…）
  api/{save,load,ranking}/     … Supabase 読み書き（service role、未設定時はno-op）
components/
  Title, Narration, WorldMap, Encounter,
  Menchi, Tanka, Brawl(Canvas), Result, Loadout, Ranking, Hud
lib/
  game/{types,data,engine}.ts  … 純粋ロジック（不変システムの数値設計）
  supabase/server.ts           … サーバ専用 Supabase クライアント
  storage.ts, playerId.ts      … クラウド⇔localStorage 抽象化
supabase/schema.sql            … knk_ スキーマ
```

## ゲームの流れ（コアループ）

```
縄張りを選ぶ → 不良に遭遇
  ├─ メンチを切る（正攻法）→ メンチビーム連打 → タンカバトル → 喧嘩
  └─ 不意打ち（男気↓）――――――――――――――――――→ 喧嘩
喧嘩(Canvas) → 勝敗で 男気・喧嘩慣れ度・平和度 が変動 → 番長度UP・技解放
→ 平和度100%で縄張り制圧 → 全制圧で「最後の番長」エンド
```

> 「悪いことは悪い、いいことはいい」――勝てばいいわけじゃねえ。漢らしく勝て。
