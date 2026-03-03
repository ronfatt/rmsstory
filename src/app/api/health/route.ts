import { NextResponse } from "next/server";
import { hasOpenAIEnv } from "@/lib/openai";
import { hasSupabaseEnv } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      supabase: hasSupabaseEnv(),
      openai: hasOpenAIEnv(),
      adminToken: Boolean(process.env.ADMIN_TOKEN),
    },
  });
}
