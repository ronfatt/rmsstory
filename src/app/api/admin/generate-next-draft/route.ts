import { NextRequest, NextResponse } from "next/server";
import { estimateWordCount, extractJsonObject, isAuthorizedAdminToken, type GeneratedChapterDraft } from "@/lib/admin";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseAdminClient } from "@/lib/supabase";

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

  const body = (await request.json()) as { bibleId?: string; chapterLengthGoal?: string };
  const bibleId = body.bibleId?.trim();
  const chapterLengthGoal = body.chapterLengthGoal?.trim() || "3200-4500 patah perkataan";

  if (!bibleId) {
    return NextResponse.json({ error: "bibleId is required." }, { status: 400 });
  }

  const [{ data: bibleRow, error: bibleError }, { data: outlineRows, error: outlineError }, { data: draftRows, error: draftError }] =
    await Promise.all([
      supabase.from("book_bibles").select("title, payload").eq("id", bibleId).single(),
      supabase
        .from("chapter_outlines")
        .select("id, chapter_number, title, focus, cliffhanger, beats")
        .eq("book_bible_id", bibleId)
        .order("chapter_number", { ascending: true }),
      supabase
        .from("chapter_drafts")
        .select("chapter_number, excerpt")
        .eq("book_bible_id", bibleId)
        .order("chapter_number", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  if (bibleError || !bibleRow) {
    return NextResponse.json({ error: "Draft bible not found." }, { status: 404 });
  }

  if (outlineError) {
    return NextResponse.json({ error: outlineError.message }, { status: 500 });
  }

  if (draftError) {
    return NextResponse.json({ error: draftError.message }, { status: 500 });
  }

  const maxDraftChapter = Math.max(0, ...(draftRows ?? []).map((row) => row.chapter_number ?? 0));
  const nextOutlineRow = (outlineRows ?? []).find((row) => row.chapter_number > maxDraftChapter);

  if (!nextOutlineRow) {
    return NextResponse.json({ error: "No next outline chapter available for this draft." }, { status: 400 });
  }

  const bible = bibleRow.payload as Record<string, unknown>;
  const outline = {
    chapter: nextOutlineRow.chapter_number,
    title: nextOutlineRow.title,
    focus: nextOutlineRow.focus,
    cliffhanger: nextOutlineRow.cliffhanger,
    beats: Array.isArray(nextOutlineRow.beats) ? nextOutlineRow.beats : [],
  };

  const previousSummary =
    draftRows?.[0]?.excerpt?.trim() || "Ini ialah bab awal. Bina dunia, konflik, dan tarikan emosi dengan jelas.";

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

    await supabase.from("chapter_drafts").insert({
      book_bible_id: bibleId,
      chapter_outline_id: nextOutlineRow.id,
      book_title: String(bible.title ?? bibleRow.title),
      chapter_number: nextOutlineRow.chapter_number,
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

    await saveGenerationJob(
      supabase,
      "generate_next_draft",
      { bibleId, chapter: nextOutlineRow.chapter_number, chapterLengthGoal },
      data,
    );

    return NextResponse.json({
      data: {
        chapterNumber: nextOutlineRow.chapter_number,
        title: data.title,
        wordCount: data.wordCount,
      },
      saved: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response as JSON.", raw },
      { status: 502 },
    );
  }
}
