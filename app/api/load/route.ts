import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import type { PlayerState } from "@/lib/game/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const client = getServiceClient();
  if (!client) return NextResponse.json({ configured: false, player: null });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ configured: true, player: null });

  const { data, error } = await client.from("knk_players").select("*").eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ configured: true, player: null });

  const player: PlayerState = {
    id: data.id,
    name: data.name,
    otokogi: data.otokogi,
    banchoDo: data.bancho_do,
    kenkaNare: data.kenka_nare,
    wins: data.wins,
    equipped: data.equipped ?? [],
    unlocked: data.unlocked ?? [],
    territories: data.territories ?? {},
    updatedAt: data.updated_at,
  };
  return NextResponse.json({ configured: true, player });
}
