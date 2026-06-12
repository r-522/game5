"use client";

import { getDistrict } from "@/lib/game/engine";
import type { Enemy } from "@/lib/game/types";

export function Encounter({
  districtKey,
  enemy,
  isBoss,
  hasWeapons,
  onMenchi,
  onCheap,
  onFlee,
}: {
  districtKey: string;
  enemy: Enemy;
  isBoss: boolean;
  hasWeapons: boolean;
  onMenchi: () => void;
  onCheap: () => void;
  onFlee: () => void;
}) {
  const d = getDistrict(districtKey)!;
  return (
    <div className="min-h-[100dvh] bg-ink text-paper p-5 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 halftone opacity-10" />
      <div className="relative w-full max-w-md text-center">
        <p className="text-xs text-paper/60 font-bold">{d.name}</p>

        <div className="my-6">
          <p className="text-blood font-black text-lg animate-pulse">― 不良が現れた！ ―</p>
          <div className={`panel mt-3 p-5 text-ink ${isBoss ? "ring-4 ring-blood" : ""}`}>
            {isBoss && <span className="stamp mb-2 text-sm">番 長</span>}
            <p className="text-xs font-bold text-ink/60">{enemy.title}</p>
            <h2 className="text-4xl font-black my-1">{enemy.name}</h2>
            <p className="text-xs font-bold text-ink/70">体力 {enemy.maxHp}・手の早さ {Math.round(10000 / enemy.attackMs) / 10}</p>
            {enemy.bark && <p className="mt-2 text-sm font-bold">「{enemy.bark}」</p>}
          </div>
        </div>

        <div className="grid gap-3">
          <button className="btn-knk btn-blood text-lg" onClick={onMenchi}>
            メンチを切る（正攻法）
          </button>
          <button className="btn-knk btn-dark" onClick={onCheap}>
            不意打ちする <span className="text-blood text-xs">（男気ダウン）</span>
          </button>
          <button className="btn-knk" onClick={onFlee}>
            逃げる
          </button>
        </div>

        {hasWeapons && (
          <p className="mt-4 text-[11px] text-gold/80 font-bold">
            ※ この縄張りには得物（武器）が落ちている。使えば強いが、男気は地に落ちるぜ。
          </p>
        )}
      </div>
    </div>
  );
}
