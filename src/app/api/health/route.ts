import { NextResponse } from "next/server";
import { hasOpenAIEnv } from "@/lib/openai";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      supabase: hasSupabaseEnv(),
      supabaseAdmin: hasSupabaseAdminEnv(),
      openai: hasOpenAIEnv(),
      adminToken: Boolean(process.env.ADMIN_TOKEN),
    },
  });
}
