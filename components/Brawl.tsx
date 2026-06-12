"use client";

import { useEffect, useRef } from "react";
import { createBrawl, VIEW_H, VIEW_W, type AttackKind } from "@/lib/game/brawl";
import { renderBrawl } from "./brawl/render";
import type { BrawlOutcome, DuelContext, Enemy, PlayerState } from "@/lib/game/types";

// 喧嘩画面の React シェル。シミュレーションは lib/game/brawl.ts、
// 描画は components/brawl/render.ts。ここでは入力とループの接続だけを行う。
export function Brawl({
  player,
  enemy,
  ctx,
  hasWeapon,
  onFinish,
}: {
  player: PlayerState;
  enemy: Enemy;
  ctx: DuelContext;
  hasWeapon: boolean;
  onFinish: (o: BrawlOutcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const ctrlRef = useRef<{
    action: (k: AttackKind) => void;
    setGuard: (v: boolean) => void;
    toggleWeapon: () => void;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const sim = createBrawl(player, enemy, ctx, hasWeapon);
    ctrlRef.current = sim;
    const enemyLabel = `${enemy.name}（${enemy.title}）`;

    // ── input ──
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "f") {
        e.preventDefault();
        ctrlRef.current?.setGuard(down);
        return;
      }
      if (!down) return;
      if (k === "j") ctrlRef.current?.action("jab");
      else if (k === "k") ctrlRef.current?.action("strong");
      else if (k === "l") ctrlRef.current?.action("special");
      else if (k === "w") ctrlRef.current?.toggleWeapon();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // ── loop ──
    let finished = false;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const outcome = sim.update(dt);
      if (outcome && !finished) {
        finished = true;
        onFinishRef.current(outcome);
      }
      renderBrawl(c, sim.g, player.name, enemyLabel);
      if (!finished) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      ctrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hold = (k: AttackKind) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      ctrlRef.current?.action(k);
    },
  });

  return (
    <div className="min-h-[100dvh] bg-ink text-paper flex flex-col items-center justify-center p-2 select-none no-tap-highlight">
      <div className="w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="w-full h-auto border-4 border-ink rounded-sm bg-black"
          style={{ imageRendering: "auto", aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        />
        {/* 操作（PC: キーボード / スマホ: ボタン） */}
        <div className="mt-2 grid grid-cols-5 gap-2">
          <button className="btn-knk py-4" {...hold("jab")}>
            J<br />
            <span className="text-[10px]">ジャブ</span>
          </button>
          <button className="btn-knk py-4" {...hold("strong")}>
            K<br />
            <span className="text-[10px]">強打</span>
          </button>
          <button className="btn-knk btn-blood py-4" {...hold("special")}>
            L<br />
            <span className="text-[10px]">必殺</span>
          </button>
          <button
            className="btn-knk btn-dark py-4"
            onPointerDown={(e) => {
              e.preventDefault();
              ctrlRef.current?.setGuard(true);
            }}
            onPointerUp={() => ctrlRef.current?.setGuard(false)}
            onPointerLeave={() => ctrlRef.current?.setGuard(false)}
          >
            ⛊<br />
            <span className="text-[10px]">ガード長押</span>
          </button>
          <button
            className="btn-knk py-4"
            disabled={!hasWeapon}
            onPointerDown={(e) => {
              e.preventDefault();
              ctrlRef.current?.toggleWeapon();
            }}
          >
            W<br />
            <span className="text-[10px]">得物</span>
          </button>
        </div>
        <p className="text-center text-[11px] text-paper/50 mt-2">
          敵の⚡に合わせてガード（ジャストガードで反撃の隙）。気合を溜めてLで必殺だ。
        </p>
      </div>
    </div>
  );
}
