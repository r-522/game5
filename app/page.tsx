"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NARRATION } from "@/lib/game/data";
import { applyDuelResult, getDistrict, nextEncounter, newPlayer } from "@/lib/game/engine";
import { getOrCreatePlayerId } from "@/lib/playerId";
import { loadPlayer, savePlayer } from "@/lib/storage";
import type { BrawlOutcome, DuelContext, Enemy, PlayerState, ResultSummary } from "@/lib/game/types";

import { Title } from "@/components/Title";
import { Narration } from "@/components/Narration";
import { WorldMap } from "@/components/WorldMap";
import { Encounter } from "@/components/Encounter";
import { Menchi } from "@/components/Menchi";
import { Tanka } from "@/components/Tanka";
import { Brawl } from "@/components/Brawl";
import { Result } from "@/components/Result";
import { Loadout } from "@/components/Loadout";
import { Ranking } from "@/components/Ranking";

type Screen =
  | "loading"
  | "intro"
  | "title"
  | "map"
  | "encounter"
  | "menchi"
  | "tanka"
  | "brawl"
  | "result"
  | "loadout"
  | "ranking"
  | "clear";

function Loading() {
  return (
    <div className="min-h-[100dvh] bg-ink text-paper flex items-center justify-center">
      <p className="font-black text-xl animate-pulse text-gold">読み込み中…</p>
    </div>
  );
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [cloud, setCloud] = useState(false);
  const [duel, setDuel] = useState<DuelContext | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [summary, setSummary] = useState<ResultSummary | null>(null);

  const playerIdRef = useRef("");
  const clearShownRef = useRef(false);

  useEffect(() => {
    const id = getOrCreatePlayerId();
    playerIdRef.current = id;
    loadPlayer(id).then((p) => {
      if (p) {
        setPlayer(p);
        setScreen("map");
      } else {
        setScreen("intro");
      }
    });
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((d) => setCloud(Boolean(d?.configured)))
      .catch(() => {});
  }, []);

  const persist = useCallback((p: PlayerState) => {
    setPlayer(p);
    savePlayer(p).then((res) => {
      if (res.cloud) setCloud(true);
    });
  }, []);

  const startEncounter = useCallback((p: PlayerState, key: string) => {
    const { enemy: en, isBoss } = nextEncounter(p, key);
    setEnemy(en);
    setDuel({
      districtKey: key,
      enemyId: en.id,
      isBoss,
      cheapShot: false,
      menchiWon: null,
      firstStrike: null,
      tankaUra: false,
    });
    setScreen("encounter");
  }, []);

  const startNew = (name: string) => {
    const p = newPlayer(playerIdRef.current, name);
    persist(p);
    setScreen("map");
  };

  const handleResult = (o: BrawlOutcome) => {
    if (!player || !duel) return;
    const s = applyDuelResult(player, duel, o);
    setSummary(s);
    persist(s.player);
    setScreen("result");
  };

  const afterResult = (toMap: boolean) => {
    if (!summary || !duel) return;
    if (summary.allCleared && !clearShownRef.current) {
      clearShownRef.current = true;
      setScreen("clear");
      return;
    }
    if (toMap) setScreen("map");
    else startEncounter(summary.player, duel.districtKey);
  };

  // ── render ──
  if (screen === "loading") return <Loading />;
  if (screen === "intro")
    return <Narration lines={NARRATION.title} onDone={() => setScreen("title")} cta="名乗りを上げる" />;
  if (screen === "title")
    return (
      <Title onStart={startNew} onContinue={() => setScreen("map")} canContinue={Boolean(player)} cloud={cloud} />
    );

  if (!player) return <Loading />;

  switch (screen) {
    case "map":
      return (
        <WorldMap
          player={player}
          onEnter={(key) => startEncounter(player, key)}
          onLoadout={() => setScreen("loadout")}
          onRanking={() => setScreen("ranking")}
        />
      );

    case "encounter":
      if (!enemy || !duel) return <Loading />;
      return (
        <Encounter
          districtKey={duel.districtKey}
          enemy={enemy}
          isBoss={duel.isBoss}
          hasWeapons={getDistrict(duel.districtKey)?.hasWeapons ?? false}
          onMenchi={() => setScreen("menchi")}
          onCheap={() => {
            setDuel({ ...duel, cheapShot: true, firstStrike: "player" });
            setScreen("brawl");
          }}
          onFlee={() => setScreen("map")}
        />
      );

    case "menchi":
      if (!enemy || !duel) return <Loading />;
      return (
        <Menchi
          player={player}
          enemy={enemy}
          isBoss={duel.isBoss}
          onDone={(win) => {
            setDuel({ ...duel, menchiWon: win });
            setScreen("tanka");
          }}
        />
      );

    case "tanka":
      if (!enemy || !duel) return <Loading />;
      return (
        <Tanka
          enemy={enemy}
          onDone={({ correct, ura }) => {
            setDuel({ ...duel, firstStrike: correct ? "player" : "enemy", tankaUra: ura });
            setScreen("brawl");
          }}
        />
      );

    case "brawl":
      if (!enemy || !duel) return <Loading />;
      return (
        <Brawl
          player={player}
          enemy={enemy}
          ctx={duel}
          hasWeapon={getDistrict(duel.districtKey)?.hasWeapons ?? false}
          onFinish={handleResult}
        />
      );

    case "result":
      if (!summary || !enemy) return <Loading />;
      return <Result summary={summary} enemy={enemy} onContinue={() => afterResult(false)} onMap={() => afterResult(true)} />;

    case "loadout":
      return (
        <Loadout
          player={player}
          onSave={(equipped) => {
            persist({ ...player, equipped });
            setScreen("map");
          }}
          onBack={() => setScreen("map")}
        />
      );

    case "ranking":
      return <Ranking player={player} onBack={() => setScreen("map")} />;

    case "clear":
      return (
        <Narration lines={NARRATION.clear} onDone={() => setScreen("map")} cta="― 完 ―" accent="#c1121f" />
      );

    default:
      return <Loading />;
  }
}
