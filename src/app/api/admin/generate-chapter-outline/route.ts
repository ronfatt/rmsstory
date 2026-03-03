import { NextRequest, NextResponse } from "next/server";
import {
  extractJsonObject,
  isAuthorizedAdminToken,
  type GeneratedChapterOutline,
  type GeneratedNovelBible,
} from "@/lib/admin";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseAdminClient } from "@/lib/supabase";

type GeneratePayload = {
  bible?: GeneratedNovelBible;
  bibleId?: string;
  totalChapters?: number;
  genre?: string;
  chapterLengthGoal?: string;
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
  const totalChapters = Math.max(12, Math.min(body.totalChapters ?? 20, 60));
  const chapterLengthGoal = body.chapterLengthGoal?.trim() || "2500-4500 patah perkataan setiap bab";

  if (!bible) {
    return NextResponse.json({ error: "Bible is required." }, { status: 400 });
  }

  const prompt = `
Anda editor utama untuk novel bersiri Bahasa Melayu dengan rasa seperti web novel komersial yang panjang.

Tugas:
- Kembangkan novel bible berikut menjadi outline ${totalChapters} bab.
- Setiap bab mesti sesuai untuk bab panjang berukuran ${chapterLengthGoal}.
- Gaya struktur mesti bertenaga seperti web novel popular Asia: konflik jelas, emosi kuat, cliffhanger keras, dan kemajuan cerita nyata.
- Jangan tiru mana-mana karya atau penulis tertentu.

Data novel:
${JSON.stringify(bible, null, 2)}

Pulangkan JSON sahaja dalam format ini:
{
  "outline": [
    {
      "chapter": 1,
      "title": "string",
      "focus": "string",
      "cliffhanger": "string",
      "beats": ["string", "string", "string", "string"]
    }
  ]
}

Peraturan:
- Tepat ${totalChapters} bab.
- Setiap bab ada 4 hingga 6 beats.
- Setiap bab mesti menggerakkan plot, hubungan, dan ketegangan serentak.
- Sebarkan rahsia, salah faham, kemenangan kecil, dan ancaman baru secara berlapis.
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const raw = response.output_text?.trim();

  if (!raw) {
    return NextResponse.json({ error: "Model returned an empty response." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(extractJsonObject(raw)) as { outline: GeneratedChapterOutline[] };
    const supabase = getSupabaseAdminClient();
    const { saved, saveError } = await saveGenerationJob(
      supabase,
      "chapter_outline",
      {
        bibleId: body.bibleId,
        totalChapters,
        chapterLengthGoal,
      },
      parsed,
    );

    if (supabase && body.bibleId) {
      await supabase.from("chapter_outlines").delete().eq("book_bible_id", body.bibleId);
      await supabase.from("chapter_outlines").insert(
        parsed.outline.map((item) => ({
          book_bible_id: body.bibleId,
          book_title: bible.title,
          chapter_number: item.chapter,
          title: item.title,
          focus: item.focus,
          cliffhanger: item.cliffhanger,
          beats: item.beats,
        })),
      );
    }

    return NextResponse.json({ data: parsed.outline, saved, saveError });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response as JSON.", raw },
      { status: 502 },
    );
  }
}
