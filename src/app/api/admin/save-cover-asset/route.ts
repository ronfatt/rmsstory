import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase";

type SavePayload = {
  bibleId?: string;
  bookTitle?: string;
  prompt?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  selected?: boolean;
};

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");

  if (!isAuthorizedAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const body = (await request.json()) as SavePayload;
  const prompt = body.prompt?.trim();
  const bookTitle = body.bookTitle?.trim();

  if (!prompt || !bookTitle) {
    return NextResponse.json({ error: "Prompt and book title are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cover_assets")
    .insert({
      book_bible_id: body.bibleId ?? null,
      book_title: bookTitle,
      prompt,
      image_url: body.imageUrl?.trim() || null,
      thumbnail_url: body.thumbnailUrl?.trim() || null,
      status: body.imageUrl ? "image_ready" : "prompt_ready",
      selected: body.selected ?? false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true, coverAssetId: data.id });
}
