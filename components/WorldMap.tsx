"use client";

import { DISTRICTS } from "@/lib/game/data";
import { isDistrictUnlocked } from "@/lib/game/engine";
import type { PlayerState } from "@/lib/game/types";
import { Hud } from "./Hud";

export function WorldMap({
  player,
  onEnter,
  onLoadout,
  onRanking,
}: {
  player: PlayerState;
  onEnter: (districtKey: string) => void;
  onLoadout: () => void;
  onRanking: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-ink text-paper p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Hud player={player} />

        <div className="flex gap-2">
          <button className="btn-knk flex-1" onClick={onLoadout}>
            技装備
          </button>
          <button className="btn-knk flex-1" onClick={onRanking}>
            全国番付
          </button>
        </div>

        <h2 className="font-black text-gold text-lg pt-1">縄張り ― 殴り込む先を選べ</h2>

        <div className="grid gap-3">
          {DISTRICTS.map((d) => {
            const peace = player.territories[d.key] ?? 0;
            const unlocked = isDistrictUnlocked(player, d);
            const cleared = peace >= 100;
            return (
              <div key={d.key} className="panel p-4 relative overflow-hidden">
                {cleared && <span className="stamp absolute top-2 right-2 text-sm">制圧済</span>}
                <div className="flex items-baseline gap-2">
                  <h3 className="font-black text-xl">{d.name}</h3>
                </div>
                <p className="text-xs text-ink/60 font-bold">{d.subtitle}</p>
                <p className="text-[11px] text-ink/70 mt-2 leading-snug">{d.intro}</p>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-black">
                    <span>平和度</span>
                    <span>{peace}%</span>
                  </div>
                  <div className="h-3 border-2 border-ink bg-white/70 overflow-hidden">
                    <div
                      className={cleared ? "h-full bg-emerald-500" : "h-full bg-blood"}
                      style={{ width: `${peace}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {unlocked ? (
                    <button className="btn-knk btn-blood w-full" onClick={() => onEnter(d.key)}>
                      {cleared ? "もう一度シメに行く" : peace >= 80 ? "番長との決着をつける" : "殴り込む"}
                    </button>
                  ) : (
                    <button className="btn-knk w-full" disabled>
                      🔒 番長度 {d.reqBanchoDo} で解放
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
