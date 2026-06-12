import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const client = getServiceClient();
  if (!client) return NextResponse.json({ configured: false, rows: [] });

  const { data, error } = await client
    .from("knk_players")
    .select("id,name,bancho_do,otokogi,wins")
    .order("bancho_do", { ascending: false })
    .order("otokogi", { ascending: false })
    .order("wins", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ configured: true, rows: [], error: error.message });
  return NextResponse.json({ configured: true, rows: data ?? [] });
}
