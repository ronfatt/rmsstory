import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { persistSelectedCover, uploadCoverBinary } from "@/lib/cover-assets";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");

  if (!isAuthorizedAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const prompt = String(formData.get("prompt") || "").trim();
  const bookTitle = String(formData.get("bookTitle") || "").trim();
  const bibleId = String(formData.get("bibleId") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!bookTitle || !prompt) {
    return NextResponse.json({ error: "Book title and prompt are required." }, { status: 400 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const uploaded = await uploadCoverBinary({
      supabase,
      fileName: `${bookTitle}-${randomUUID()}-${file.name}`,
      bytes: buffer,
      contentType: file.type || "image/png",
    });

    const savedAsset = await persistSelectedCover({
      supabase,
      bibleId: bibleId || undefined,
      bookTitle,
      prompt,
      imageUrl: uploaded.imageUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      selected: true,
    });

    return NextResponse.json({
      saved: true,
      coverAssetId: savedAsset.coverAssetId,
      imageUrl: uploaded.imageUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload cover asset." },
      { status: 500 },
    );
  }
}
