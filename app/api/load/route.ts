import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { rowToPlayer } from "@/lib/supabase/players";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const client = getServiceClient();
  if (!client) return NextResponse.json({ configured: false, player: null });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ configured: true, player: null });

  const { data, error } = await client.from("knk_players").select("*").eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ configured: true, player: null });

  return NextResponse.json({ configured: true, player: rowToPlayer(data) });
}
