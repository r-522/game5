"use client";

import { useCallback, useEffect, useState } from "react";

export function Narration({
  lines,
  onDone,
  cta = "次へ",
  accent = "#ffc300",
}: {
  lines: string[];
  onDone: () => void;
  cta?: string;
  accent?: string;
}) {
  const [i, setI] = useState(0);
  const last = i >= lines.length - 1;

  const advance = useCallback(() => {
    setI((x) => {
      if (x >= lines.length - 1) {
        onDone();
        return x;
      }
      return x + 1;
    });
  }, [lines.length, onDone]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [advance]);

  return (
    <div
      onClick={advance}
      className="min-h-[100dvh] flex flex-col items-center justify-center bg-ink text-paper p-8 cursor-pointer select-none no-tap-highlight"
    >
      <div className="max-w-2xl w-full text-center space-y-5">
        {lines.slice(0, i + 1).map((l, idx) => (
          <p
            key={idx}
            className={`text-xl md:text-3xl font-black leading-relaxed ${
              idx === i ? "fade-in" : "opacity-50"
            }`}
            style={idx === i ? { textShadow: `0 0 18px ${accent}55` } : undefined}
          >
            {l}
          </p>
        ))}
      </div>
      <button className="btn-knk mt-12" style={{ background: accent }}>
        {last ? cta : "▼ クリック / Space"}
      </button>
    </div>
  );
}
