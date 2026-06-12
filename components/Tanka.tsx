"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Enemy, TankaOption } from "@/lib/game/types";

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// タンカバトル：制限時間内に正しい啖呵を選べば先制攻撃。裏正解は更に粋。
export function Tanka({
  enemy,
  onDone,
}: {
  enemy: Enemy;
  onDone: (r: { correct: boolean; ura: boolean }) => void;
}) {
  const DURATION = 6000;
  const prov = useMemo(
    () => enemy.provocations[Math.floor(Math.random() * enemy.provocations.length)],
    [enemy],
  );
  const options = useMemo<TankaOption[]>(() => shuffle(prov.options), [prov]);

  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [picked, setPicked] = useState<number | null>(null);
  const doneRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = (idx: number | null) => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setPicked(idx);
    const opt = idx === null ? undefined : options[idx];
    timeoutRef.current = setTimeout(
      () => onDone({ correct: Boolean(opt?.correct), ura: Boolean(opt?.ura) }),
      950,
    );
  };

  useEffect(() => {
    startRef.current = performance.now();
    const loop = (now: number) => {
      const left = DURATION - (now - startRef.current);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) return finish(null);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) finish(n - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  const reveal = picked !== null || timeLeft <= 0;

  return (
    <div className="min-h-[100dvh] bg-ink text-paper flex flex-col items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 halftone opacity-10" />
      <p className="relative font-black text-gold text-lg">― タンカを切れ！ ―</p>

      {/* タイマー */}
      <div className="relative w-full max-w-lg h-2 border-2 border-paper/40 my-3">
        <div
          className={`h-full ${timeLeft < 2000 ? "bg-blood" : "bg-gold"}`}
          style={{ width: `${(timeLeft / DURATION) * 100}%` }}
        />
      </div>

      {/* 相手の煽り */}
      <div className="relative panel text-ink p-4 max-w-lg w-full mb-5">
        <p className="text-xs font-bold text-ink/50 mb-1">{enemy.name} の煽り</p>
        <p className="text-xl md:text-2xl font-black leading-snug">「{prov.taunt}」</p>
      </div>

      {/* 選択肢 */}
      <div className="relative grid gap-2 w-full max-w-lg">
        {options.map((o, i) => {
          let cls = "bg-white/85 border-ink/30";
          if (reveal) {
            if (o.correct) cls = "bg-emerald-300 border-ink";
            else if (picked === i) cls = "bg-blood/80 text-white border-ink";
            else cls = "bg-white/40 border-ink/20 opacity-60";
          }
          return (
            <button
              key={i}
              disabled={reveal}
              onClick={() => finish(i)}
              className={`text-left p-3 rounded-sm border-3 font-bold text-ink transition ${cls}`}
              style={{ borderWidth: 3 }}
            >
              <span className="inline-block w-6 font-black text-blood">{i + 1}.</span>
              {o.text}
              {reveal && o.ura && <span className="ml-2 text-xs font-black text-blood">［裏正解］</span>}
            </button>
          );
        })}
      </div>

      {reveal && (
        <p
          className={`relative mt-5 text-3xl font-black text-stroke fade-in ${
            picked !== null && options[picked]?.correct ? "text-gold" : "text-blood"
          }`}
        >
          {picked !== null && options[picked]?.ura
            ? "粋だねぇ！ 完全先制！"
            : picked !== null && options[picked]?.correct
              ? "先手必勝！"
              : "シャバい…！ 先手を取られた"}
        </p>
      )}
    </div>
  );
}
