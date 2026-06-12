"use client";

import { useEffect, useState } from "react";
import { fetchRanking } from "@/lib/storage";
import type { PlayerState, RankRow } from "@/lib/game/types";

export function Ranking({ player, onBack }: { player: PlayerState; onBack: () => void }) {
  const [state, setState] = useState<{ loading: boolean; configured: boolean; rows: RankRow[] }>({
    loading: true,
    configured: false,
    rows: [],
  });

  useEffect(() => {
    let alive = true;
    fetchRanking().then((r) => {
      if (alive) setState({ loading: false, configured: r.configured, rows: r.rows });
    });
    return () => {
      alive = false;
    };
  }, []);

  const rows: RankRow[] = state.configured
    ? state.rows
    : [{ id: player.id, name: player.name, bancho_do: player.banchoDo, otokogi: player.otokogi, wins: player.wins }];

  return (
    <div className="min-h-[100dvh] bg-ink text-paper p-5">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-black text-gold">全国番長番付</h2>
          <button className="btn-knk" onClick={onBack}>
            戻る
          </button>
        </div>

        {state.loading ? (
          <p className="text-center py-10 font-bold animate-pulse">番付を確認中…</p>
        ) : (
          <div className="panel text-ink overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink text-paper">
                <tr>
                  <th className="py-2 px-2 text-left">順</th>
                  <th className="py-2 px-2 text-left">番長名</th>
                  <th className="py-2 px-2 text-right">番長度</th>
                  <th className="py-2 px-2 text-right">男気</th>
                  <th className="py-2 px-2 text-right">勝星</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const mine = r.id === player.id;
                  return (
                    <tr key={r.id} className={mine ? "bg-gold/40 font-black" : idx % 2 ? "bg-black/5" : ""}>
                      <td className="py-1.5 px-2">{idx + 1}</td>
                      <td className="py-1.5 px-2 truncate max-w-[10rem]">
                        {r.name} {mine && <span className="text-blood">★</span>}
                      </td>
                      <td className="py-1.5 px-2 text-right">{r.bancho_do}</td>
                      <td className="py-1.5 px-2 text-right">{r.otokogi}</td>
                      <td className="py-1.5 px-2 text-right">{r.wins}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!state.loading && !state.configured && (
          <p className="mt-4 text-xs text-paper/60 text-center">
            ※ Supabase 未設定のためローカル表示。クラウド連携すると全国の番長と番付を競えるぜ。
          </p>
        )}
      </div>
    </div>
  );
}
