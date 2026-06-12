"use client";

import { useState } from "react";

export function Title({
  onStart,
  onContinue,
  canContinue,
  cloud,
}: {
  onStart: (name: string) => void;
  onContinue: () => void;
  canContinue: boolean;
  cloud: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-ink text-paper flex flex-col items-center justify-center p-6 speed-lines">
      <div className="absolute inset-0 halftone opacity-20" />
      <div className="relative text-center">
        <p className="text-gold font-black tracking-[0.4em] text-sm md:text-base mb-2">KENKA BANCHO 7</p>
        <h1 className="text-5xl md:text-7xl font-black leading-none text-stroke" style={{ color: "#fff" }}>
          喧嘩番長
          <span className="text-blood">7</span>
        </h1>
        <p className="mt-3 text-xl md:text-2xl font-black tracking-widest">― 最 後 の 番 長 ―</p>
        <p className="mt-4 text-xs md:text-sm text-paper/60 max-w-md mx-auto">
          番長が絶滅したと言われる令和。<br className="md:hidden" />それでも拳で語る、たった一人の物語。
        </p>
      </div>

      <div className="relative mt-10 w-full max-w-sm panel p-5 text-ink">
        <label className="block text-sm font-black mb-1">名を名乗りな（番長名）</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          placeholder="例：不死身の○○"
          className="w-full border-3 border-ink rounded-sm px-3 py-2 font-bold bg-white outline-none focus:bg-gold/20"
          style={{ borderWidth: 3 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onStart(name);
          }}
        />
        <button className="btn-knk btn-blood w-full mt-4 text-lg" disabled={!name.trim()} onClick={() => onStart(name)}>
          殴り込み開始
        </button>
        {canContinue && (
          <button className="btn-knk w-full mt-3" onClick={onContinue}>
            つづきから
          </button>
        )}
        <p className="mt-3 text-[11px] text-center text-ink/60">
          {cloud ? "☁ クラウドセーブ有効（全国ランキング参加）" : "💾 ローカルセーブ（この端末のみ）"}
        </p>
      </div>

      <p className="relative mt-8 text-[11px] text-paper/40">操作：J=ジャブ K=強 L=必殺 Space=ガード</p>
    </div>
  );
}
