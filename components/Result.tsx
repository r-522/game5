"use client";

import type { Enemy, ResultSummary } from "@/lib/game/types";
import { Meter } from "./Meter";

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-ink/50">±0</span>;
  return <span className={value > 0 ? "text-emerald-600" : "text-blood"}>{value > 0 ? `+${value}` : value}</span>;
}

export function Result({
  summary,
  enemy,
  onContinue,
  onMap,
}: {
  summary: ResultSummary;
  enemy: Enemy;
  onContinue: () => void;
  onMap: () => void;
}) {
  const win = summary.win;
  return (
    <div className="min-h-[100dvh] bg-ink text-paper p-5 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className={`text-6xl font-black ${win ? "text-gold" : "text-blood"} text-stroke fade-in`}>
            {win ? "勝 利" : "敗 北"}
          </div>
          <p className="mt-1 text-sm font-bold text-paper/70">
            {win ? `${enemy.name} をシメ上げた` : `${enemy.name} に敗れた`}
          </p>
        </div>

        <div className="panel text-ink p-4 space-y-3">
          {summary.districtCleared && (
            <div className="text-center">
              <span className="stamp text-lg">縄張り制圧！</span>
            </div>
          )}

          <div className="flex justify-between font-black">
            <span>男気</span>
            <Delta value={summary.otokogiDelta} />
          </div>
          <div className="flex justify-between font-black">
            <span>喧嘩慣れ</span>
            <span className="text-ink/80">+{summary.kenkaNareGain}</span>
          </div>

          {!summary.districtCleared && (
            <div>
              <div className="flex justify-between text-xs font-black">
                <span>縄張りの平和度</span>
                <span>
                  {summary.peaceBefore}% → {summary.peaceAfter}%
                </span>
              </div>
              <Meter
                ratio={summary.peaceAfter / 100}
                fill="bg-blood transition-all"
                className="h-2.5 border-2 border-ink bg-white/70"
              />
            </div>
          )}

          {summary.messages.length > 0 && (
            <ul className="text-xs font-bold space-y-1 border-t-2 border-ink/20 pt-2">
              {summary.messages.map((m, i) => (
                <li key={i} className="text-ink/80">
                  ・{m}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-2 mt-5">
          {win && !summary.districtCleared && (
            <button className="btn-knk btn-blood text-lg" onClick={onContinue}>
              続けて殴り込む
            </button>
          )}
          {!win && (
            <button className="btn-knk btn-blood text-lg" onClick={onContinue}>
              もう一度かかってこい
            </button>
          )}
          <button className="btn-knk" onClick={onMap}>
            縄張りマップへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
