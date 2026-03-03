import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken, type GeneratedNovelBible } from "@/lib/admin";
import { persistSelectedCover } from "@/lib/cover-assets";
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

  if (!client) {
    return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
  }

  const body = (await request.json()) as GeneratePayload;
  const bible = body.bible;
  const genre = body.genre?.trim() || "Romansa Drama";
  const coverDirection =
    body.coverDirection?.trim() ||
    "mesti nampak premium, dramatik, komersial, dan sesuai untuk pembaca web novel Asia Tenggara";

  if (!bible) {
    return NextResponse.json({ error: "Bible is required." }, { status: 400 });
  }

  try {
    const parsed = await generateCoverConcept({
      client,
      bible,
      genre,
      coverDirection,
    });
    const supabase = getSupabaseAdminClient();
    const { saved, saveError } = await saveGenerationJob(
      supabase,
      "cover_prompt",
      {
        bibleId: body.bibleId,
        genre,
        coverDirection,
      },
      parsed,
    );

    let coverAssetId: string | undefined;

    if (supabase) {
      const savedAsset = await persistSelectedCover({
        supabase,
        bibleId: body.bibleId,
        bookTitle: bible.title,
        prompt: parsed.prompt,
        selected: false,
      });
      coverAssetId = savedAsset.coverAssetId;
    }

    return NextResponse.json({ data: parsed, saved, saveError, coverAssetId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate cover prompt." },
      { status: 502 },
    );
  }
}
