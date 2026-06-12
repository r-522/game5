"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { menchiPower } from "@/lib/game/engine";
import type { Enemy, PlayerState } from "@/lib/game/types";

// メンチビーム：連打で光線のせめぎ合いを相手側へ押し込む。
// pos 50=中央。100へ押し込めば勝ち(>=82)、18以下で負け。男気が高いほど一発が重い。
export function Menchi({
  player,
  enemy,
  isBoss,
  onDone,
}: {
  player: PlayerState;
  enemy: Enemy;
  isBoss: boolean;
  onDone: (win: boolean) => void;
}) {
  const DURATION = 4500;
  const posRef = useRef(50);
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const pulseRef = useRef(0);
  const doneRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pos, setPos] = useState(50);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [resultWin, setResultWin] = useState<boolean | null>(null);

  const tapPush = 5.5 * menchiPower(player);
  const enemyRate = (isBoss ? 17 : 11) + enemy.power * 0.5;

  const finish = useCallback(
    (win: boolean) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setResultWin(win);
      timeoutRef.current = setTimeout(() => onDone(win), 700);
    },
    [onDone],
  );

  const tap = useCallback(() => {
    if (doneRef.current) return;
    posRef.current = Math.min(100, posRef.current + tapPush);
    pulseRef.current = 1;
  }, [tapPush]);

  useEffect(() => {
    lastRef.current = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - lastRef.current) / 1000;
      lastRef.current = now;
      elapsedRef.current += dt * 1000;
      posRef.current = Math.max(0, posRef.current - enemyRate * dt);
      pulseRef.current = Math.max(0, pulseRef.current - dt * 4);
      setPos(posRef.current);
      setTimeLeft(Math.max(0, DURATION - elapsedRef.current));

      if (posRef.current >= 82) return finish(true);
      if (posRef.current <= 18) return finish(false);
      if (elapsedRef.current >= DURATION) return finish(posRef.current > 50);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enemyRate, finish]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [tap]);

  const clashScale = 1 + pulseRef.current * 0.6;
  const winning = pos > 55;
  const losing = pos < 45;

  return (
    <div className="min-h-[100dvh] bg-ink text-paper flex flex-col items-center justify-center p-5 relative overflow-hidden select-none no-tap-highlight">
      <div className="absolute inset-0 halftone opacity-10" />
      <p className="relative font-black text-blood text-lg animate-pulse">― メンチを切れ！ ―</p>
      <p className="relative text-xs text-paper/60 mb-4">連打でメンチビームを相手に押し返せ（Space / 連打）</p>

      {/* タイマー */}
      <div className="relative w-full max-w-xl h-2 border-2 border-paper/40 mb-6">
        <div className="h-full bg-gold transition-none" style={{ width: `${(timeLeft / DURATION) * 100}%` }} />
      </div>

      {/* せめぎ合い */}
      <div className="relative w-full max-w-xl h-32 flex items-center">
        {/* 自分 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-center">
          <div className={`text-4xl ${winning ? "scale-110" : ""} transition`}>👊</div>
          <div className="text-[10px] font-black text-sky-300">{player.name}</div>
        </div>
        {/* 相手 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-center">
          <div className={`text-4xl ${losing ? "scale-110" : ""} transition`}>💢</div>
          <div className="text-[10px] font-black text-blood">{enemy.name}</div>
        </div>

        {/* ビーム track */}
        <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-2 bg-paper/20 rounded-full" />
        <div
          className="absolute left-12 top-1/2 -translate-y-1/2 h-2 rounded-full"
          style={{ width: `calc(${pos}% - 3rem)`, background: "linear-gradient(90deg,#38bdf8,#fff)" }}
        />
        <div
          className="absolute top-1/2 h-2 rounded-full"
          style={{
            right: "3rem",
            width: `calc(${100 - pos}% - 3rem)`,
            background: "linear-gradient(90deg,#fff,#c1121f)",
          }}
        />
        {/* clash orb */}
        <div
          className="absolute top-1/2 w-10 h-10 rounded-full"
          style={{
            left: `calc(${pos}% )`,
            transform: `translate(-50%,-50%) scale(${clashScale})`,
            background: "radial-gradient(circle, #fff 0%, #ffd60a 45%, transparent 70%)",
            boxShadow: "0 0 24px 8px rgba(255,214,10,.6)",
          }}
        />
      </div>

      <button className="btn-knk btn-blood relative mt-10 text-2xl px-12 py-5" onPointerDown={tap}>
        連 打！
      </button>

      {resultWin !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
          <span className={`text-6xl font-black text-stroke ${resultWin ? "text-gold" : "text-blood"} fade-in`}>
            {resultWin ? "メンチ勝ち！" : "睨み負け…"}
          </span>
        </div>
      )}
    </div>
  );
}
