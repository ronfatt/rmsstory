import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken, type GeneratedNovelBible } from "@/lib/admin";
import { persistSelectedCover, uploadCoverBinary } from "@/lib/cover-assets";
import { generateCoverConcept } from "@/lib/cover-prompt";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseAdminClient } from "@/lib/supabase";

type GeneratePayload = {
  bible?: GeneratedNovelBible;
  bibleId?: string;
  genre?: string;
  coverDirection?: string;
};

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");

  if (!isAuthorizedAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getOpenAIClient();
  const supabase = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const body = (await request.json()) as GeneratePayload;
  const bible = body.bible;
  const genre = body.genre?.trim() || "Romansa Drama";
  const coverDirection =
    body.coverDirection?.trim() ||
    "watak utama dominan, sinematik, premium, thumbnail-friendly, sangat kuat untuk tarik klik";

  if (!bible) {
    return NextResponse.json({ error: "Bible is required." }, { status: 400 });
  }

  try {
    const concept = await generateCoverConcept({
      client,
      bible,
      genre,
      coverDirection,
    });

    const imageResponse = await client.images.generate({
      model: "gpt-image-1",
      prompt: concept.prompt,
      size: "1024x1536",
    });

    const base64 = imageResponse.data?.[0]?.b64_json;

    if (!base64) {
      return NextResponse.json({ error: "Image generation returned no image data." }, { status: 502 });
    }

    const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
    const uploaded = await uploadCoverBinary({
      supabase,
      fileName: `${bible.title}-${randomUUID()}.png`,
      bytes,
      contentType: "image/png",
    });

    const savedAsset = await persistSelectedCover({
      supabase,
      bibleId: body.bibleId,
      bookTitle: bible.title,
      prompt: concept.prompt,
      imageUrl: uploaded.imageUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      selected: true,
    });

    const { saved, saveError } = await saveGenerationJob(
      supabase,
      "cover_auto_publish",
      {
        bibleId: body.bibleId,
        genre,
        coverDirection,
      },
      {
        concept,
        imageUrl: uploaded.imageUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
      },
    );

    return NextResponse.json({
      data: concept,
      imageUrl: uploaded.imageUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      coverAssetId: savedAsset.coverAssetId,
      saved,
      saveError,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate and publish cover." },
      { status: 500 },
    );
  }
}
