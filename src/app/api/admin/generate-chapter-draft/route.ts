import { NextRequest, NextResponse } from "next/server";
import {
  estimateWordCount,
  extractJsonObject,
  isAuthorizedAdminToken,
  type GeneratedChapterDraft,
  type GeneratedChapterOutline,
  type GeneratedNovelBible,
} from "@/lib/admin";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseAdminClient } from "@/lib/supabase";

type GeneratePayload = {
  bible?: GeneratedNovelBible;
  bibleId?: string;
  outline?: GeneratedChapterOutline;
  previousSummary?: string;
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
  const outline = body.outline;
  const previousSummary = body.previousSummary?.trim() || "Ini ialah bab awal. Bina dunia, konflik, dan tarikan emosi dengan jelas.";
  const chapterLengthGoal = body.chapterLengthGoal?.trim() || "3200-4500 patah perkataan";

  if (!bible || !outline) {
    return NextResponse.json({ error: "Bible and outline are required." }, { status: 400 });
  }

  const prompt = `
Anda penulis novel bersiri Bahasa Melayu untuk pembaca yang suka bab sangat panjang seperti web novel komersial.

Objektif:
- Tulis satu bab penuh dan panjang dalam Bahasa Melayu semula jadi.
- Sasaran panjang: ${chapterLengthGoal}.
- Elakkan gaya ringkasan. Tunjukkan adegan demi adegan.
- Wajib ada dialog, monolog dalaman, gerakan plot, ketegangan emosi, dan cliffhanger penutup.
- Jangan tiru mana-mana karya atau penulis tertentu, tetapi kekalkan rentak dramatik, addictive, dan sangat episodik.

Data novel:
${JSON.stringify(bible, null, 2)}

Outline bab:
${JSON.stringify(outline, null, 2)}

Ringkasan bab sebelumnya:
${previousSummary}

Pulangkan JSON sahaja:
{
  "title": "string",
  "excerpt": "string",
  "content": ["perenggan panjang", "perenggan panjang"],
  "seoTitle": "string",
  "seoDescription": "string",
  "recommendationCopy": "string"
}

Peraturan keras:
- Sekurang-kurangnya 14 perenggan panjang.
- Setiap perenggan mesti bersifat naratif, bukan nota ringkas.
- Mesti ada sekurang-kurangnya 2 peningkatan konflik.
- Mesti ada 1 pendedahan atau putaran emosi.
- Penutup bab mesti kuat dan membuat pembaca mahu sambung segera.
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
    const parsed = JSON.parse(extractJsonObject(raw)) as Omit<GeneratedChapterDraft, "wordCount">;
    const data: GeneratedChapterDraft = {
      ...parsed,
      wordCount: estimateWordCount(parsed.content),
    };
    const supabase = getSupabaseAdminClient();
    const { saved, saveError } = await saveGenerationJob(
      supabase,
      "chapter_draft",
      {
        bibleId: body.bibleId,
        chapter: outline.chapter,
        chapterLengthGoal,
      },
      data,
    );

    if (supabase) {
      let chapterOutlineId: string | undefined;

      if (body.bibleId) {
        const { data: outlineRow } = await supabase
          .from("chapter_outlines")
          .select("id")
          .eq("book_bible_id", body.bibleId)
          .eq("chapter_number", outline.chapter)
          .maybeSingle();

        chapterOutlineId = outlineRow?.id;
      }

      await supabase.from("chapter_drafts").insert({
        book_bible_id: body.bibleId ?? null,
        chapter_outline_id: chapterOutlineId ?? null,
        book_title: bible.title,
        chapter_number: outline.chapter,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        word_count: data.wordCount,
        seo_payload: {
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          recommendationCopy: data.recommendationCopy,
        },
      });
    }

    return NextResponse.json({ data, saved, saveError });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response as JSON.", raw },
      { status: 502 },
    );
  }
}
