"use client";

import { useState } from "react";
import { TECHNIQUES } from "@/lib/game/data";
import { getTechnique, specialSlots } from "@/lib/game/engine";
import type { PlayerState, Technique, TechniqueType } from "@/lib/game/types";

const TYPE_LABEL: Record<TechniqueType, string> = { jab: "ジャブ (J)", strong: "強打 (K)", special: "必殺 (L)" };

function TechCard({
  t,
  selected,
  disabled,
  onClick,
}: {
  t: Technique;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-3 rounded-sm border-3 transition ${
        selected ? "bg-gold border-ink shadow-[3px_3px_0_0_#0a0908]" : "bg-white/70 border-ink/30"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-ink"}`}
    >
      <div className="flex justify-between items-baseline">
        <span className="font-black">{t.name}</span>
        <span className="text-[11px] font-bold text-blood">威力{t.damage}</span>
      </div>
      <p className="text-[11px] text-ink/70 mt-1 leading-snug">{t.desc}</p>
      <p className="text-[10px] text-ink/50 mt-1">
        {t.type === "special" ? `気合 -${t.kiaiCost}` : `気合 +${t.kiaiGain}`}・隙{t.windupMs + t.recoverMs}ms
      </p>
    </button>
  );
}

export function Loadout({
  player,
  onSave,
  onBack,
}: {
  player: PlayerState;
  onSave: (equipped: string[]) => void;
  onBack: () => void;
}) {
  const unlocked = TECHNIQUES.filter((t) => player.unlocked.includes(t.id));
  const eq = player.equipped.map(getTechnique).filter(Boolean) as Technique[];
  const maxSpecials = specialSlots(player.banchoDo);

  const [jab, setJab] = useState<string>(eq.find((t) => t.type === "jab")?.id ?? unlocked.find((t) => t.type === "jab")!.id);
  const [strong, setStrong] = useState<string>(
    eq.find((t) => t.type === "strong")?.id ?? unlocked.find((t) => t.type === "strong")!.id,
  );
  const [specials, setSpecials] = useState<string[]>(eq.filter((t) => t.type === "special").map((t) => t.id));

  const toggleSpecial = (id: string) =>
    setSpecials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < maxSpecials ? [...prev, id] : prev,
    );

  const byType = (type: TechniqueType) => unlocked.filter((t) => t.type === type);
  const nextLock = TECHNIQUES.filter((t) => !player.unlocked.includes(t.id)).sort((a, b) => a.reqBanchoDo - b.reqBanchoDo)[0];

  return (
    <div className="min-h-[100dvh] bg-ink text-paper p-5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-black text-gold">技 装 備</h2>
          <div className="flex gap-2">
            <button className="btn-knk" onClick={onBack}>
              やめる
            </button>
            <button className="btn-knk btn-blood" onClick={() => onSave([jab, strong, ...specials])}>
              これで決まり
            </button>
          </div>
        </div>

        <section className="mb-4">
          <h3 className="font-black mb-2 text-paper/90">{TYPE_LABEL.jab}</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {byType("jab").map((t) => (
              <TechCard key={t.id} t={t} selected={jab === t.id} onClick={() => setJab(t.id)} />
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="font-black mb-2 text-paper/90">{TYPE_LABEL.strong}</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {byType("strong").map((t) => (
              <TechCard key={t.id} t={t} selected={strong === t.id} onClick={() => setStrong(t.id)} />
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="font-black mb-2 text-paper/90">
            必殺（{specials.length}/{maxSpecials} 装備）
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {byType("special").map((t) => {
              const sel = specials.includes(t.id);
              return (
                <TechCard
                  key={t.id}
                  t={t}
                  selected={sel}
                  disabled={!sel && specials.length >= maxSpecials}
                  onClick={() => toggleSpecial(t.id)}
                />
              );
            })}
          </div>
        </section>

        {nextLock && (
          <p className="text-xs text-paper/50 text-center mt-4">
            次の解放：「{nextLock.name}」は番長度 {nextLock.reqBanchoDo} で習得
          </p>
        )}
      </div>
    </div>
  );
}
