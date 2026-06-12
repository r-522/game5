import type { PlayerState } from "@/lib/game/types";

// knk_players テーブル（snake_case）と PlayerState（camelCase）の変換。
// save/load の両ルートでカラム対応がずれないよう、ここに集約する。

export interface PlayerRow {
  id: string;
  name: string;
  otokogi: number;
  bancho_do: number;
  kenka_nare: number;
  wins: number;
  equipped: string[];
  unlocked: string[];
  territories: Record<string, number>;
  updated_at: string;
}

export function playerToRow(p: PlayerState): PlayerRow {
  return {
    id: p.id,
    name: p.name,
    otokogi: p.otokogi,
    bancho_do: p.banchoDo,
    kenka_nare: p.kenkaNare,
    wins: p.wins,
    equipped: p.equipped,
    unlocked: p.unlocked,
    territories: p.territories,
    updated_at: p.updatedAt,
  };
}

export function rowToPlayer(row: PlayerRow): PlayerState {
  return {
    id: row.id,
    name: row.name,
    otokogi: row.otokogi,
    banchoDo: row.bancho_do,
    kenkaNare: row.kenka_nare,
    wins: row.wins,
    equipped: row.equipped ?? [],
    unlocked: row.unlocked ?? [],
    territories: row.territories ?? {},
    updatedAt: row.updated_at,
  };
}
