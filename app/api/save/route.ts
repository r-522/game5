import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { playerToRow } from "@/lib/supabase/players";
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
    const { error } = await client.from("knk_players").upsert(playerToRow(p));
    if (error) {
      return NextResponse.json({ ok: false, configured: true, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, configured: true });
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, error: String(e) }, { status: 400 });
  }
}
