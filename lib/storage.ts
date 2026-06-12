"use client";

import { STORAGE_KEY } from "./game/data";
import { normalizePlayer } from "./game/engine";
import type { PlayerState, RankRow } from "./game/types";

function readLocal(): PlayerState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizePlayer(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(p: PlayerState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }
}

/** クラウド(Supabase)を試し、未設定/失敗なら localStorage を使う。 */
export async function loadPlayer(id: string): Promise<PlayerState | null> {
  try {
    const res = await fetch(`/api/load?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.configured && data?.player) {
        const p = normalizePlayer(data.player);
        writeLocal(p);
        return p;
      }
    }
  } catch {
    /* オフライン: ローカルにフォールバック */
  }
  return readLocal();
}

/** localStorage には必ず保存し、Supabase へはベストエフォートで同期。 */
export async function savePlayer(p: PlayerState): Promise<{ cloud: boolean }> {
  writeLocal(p);
  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (res.ok) {
      const d = await res.json();
      return { cloud: Boolean(d?.ok) };
    }
  } catch {
    /* オフライン: ローカルのみ */
  }
  return { cloud: false };
}

export async function fetchRanking(): Promise<{ configured: boolean; rows: RankRow[] }> {
  try {
    const res = await fetch("/api/ranking", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      return { configured: Boolean(d?.configured), rows: (d?.rows ?? []) as RankRow[] };
    }
  } catch {
    /* noop */
  }
  return { configured: false, rows: [] };
}
