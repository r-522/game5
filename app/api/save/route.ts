import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { normalizePlayer } from "@/lib/game/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const client = getServiceClient();
  if (!client) return NextResponse.json({ ok: false, configured: false });

  try {
    const body = await req.json();
    if (!body?.id || !body?.name) {
      return NextResponse.json({ ok: false, configured: true, error: "missing id/name" }, { status: 400 });
    }
    const p = normalizePlayer(body);
    const { error } = await client.from("knk_players").upsert({
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
    });
    if (error) {
      return NextResponse.json({ ok: false, configured: true, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, configured: true });
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, error: String(e) }, { status: 400 });
  }
}
