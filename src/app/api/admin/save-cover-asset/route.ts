import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { persistSelectedCover } from "@/lib/cover-assets";
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

  try {
    const savedAsset = await persistSelectedCover({
      supabase,
      bibleId: body.bibleId,
      bookTitle,
      prompt,
      imageUrl: body.imageUrl?.trim() || undefined,
      thumbnailUrl: body.thumbnailUrl?.trim() || undefined,
      selected: body.selected ?? false,
    });

    return NextResponse.json({ saved: true, coverAssetId: savedAsset.coverAssetId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save cover asset." },
      { status: 500 },
    );
  }
}
