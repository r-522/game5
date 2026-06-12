"use client";

import { maxHp, otokogiTier, xpForNext } from "@/lib/game/engine";
import type { PlayerState } from "@/lib/game/types";
import { Meter } from "./Meter";

export function OtokogiBar({ value, compact = false }: { value: number; compact?: boolean }) {
  const tier = otokogiTier(value);
  const danger = tier.key === "shaba";
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline text-xs font-black">
        <span>男気</span>
        <span className={danger ? "text-blood animate-pulse" : "text-ink/80"}>
          {tier.label}
          {!compact && <span className="font-bold ml-1 text-ink/60">{value}</span>}
        </span>
      </div>
      <Meter
        ratio={value / 100}
        fill={danger ? "bg-blood transition-all" : "bg-gold transition-all"}
        className="h-3 border-2 border-ink bg-white/70"
      />
    </div>
  );
}

export function Hud({ player }: { player: PlayerState }) {
  const need = xpForNext(player.banchoDo);
  return (
    <div className="panel p-3 grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-black text-lg truncate">{player.name}</span>
        <span className="text-sm font-bold whitespace-nowrap">
          番長度 <b className="text-blood text-2xl align-middle">{player.banchoDo}</b>
        </span>
      </div>
      <OtokogiBar value={player.otokogi} />
      <div className="flex justify-between text-[11px] font-bold text-ink/70">
        <span>喧嘩慣れ {player.kenkaNare}/{need}</span>
        <span>勝星 {player.wins}・体力 {maxHp(player.banchoDo)}</span>
      </div>
    </div>
  );
}
