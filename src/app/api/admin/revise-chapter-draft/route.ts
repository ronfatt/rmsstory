import { NextRequest, NextResponse } from "next/server";
import {
  estimateWordCount,
  extractJsonObject,
  isAuthorizedAdminToken,
  type GeneratedChapterRevision,
} from "@/lib/admin";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseAdminClient } from "@/lib/supabase";

type RevisionMode = "continue" | "rewrite" | "expand";

type GeneratePayload = {
  mode?: RevisionMode;
  bookTitle?: string;
  chapterTitle?: string;
  sourceContent?: string[];
  sourceExcerpt?: string;
  revisionInstruction?: string;
  chapterLengthGoal?: string;
};

const modeInstructionMap: Record<RevisionMode, string> = {
  continue:
    "Sambung bab ini dengan beberapa adegan baharu tanpa mengulang terlalu banyak perenggan lama. Kekalkan kesinambungan emosi dan tutup dengan cliffhanger yang lebih keras.",
  rewrite:
    "Tulis semula bab ini supaya lebih dramatik, lebih padat emosi, lebih beralun seperti web novel panjang, dan kurang terasa seperti draf AI mentah.",
  expand:
    "Kembangkan bab ini menjadi lebih panjang dengan menambah adegan, dialog, konflik dalaman, dan lapisan hubungan tanpa merosakkan struktur asal.",
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
  const mode = body.mode ?? "rewrite";
  const bookTitle = body.bookTitle?.trim() || "Novel Tanpa Tajuk";
  const chapterTitle = body.chapterTitle?.trim() || "Bab Baharu";
  const sourceContent = body.sourceContent?.filter(Boolean) ?? [];
  const sourceExcerpt = body.sourceExcerpt?.trim() || "";
  const revisionInstruction = body.revisionInstruction?.trim() || modeInstructionMap[mode];
  const chapterLengthGoal = body.chapterLengthGoal?.trim() || "3200-5000 patah perkataan";

  if (sourceContent.length === 0) {
    return NextResponse.json({ error: "Source chapter content is required." }, { status: 400 });
  }

  const prompt = `
Anda editor dan ghostwriter untuk novel bersiri Bahasa Melayu yang panjang, dramatik, dan sangat ketagihan.

Mod semasa: ${mode}

Tajuk novel: ${bookTitle}
Tajuk bab: ${chapterTitle}
Sasaran panjang: ${chapterLengthGoal}

Arahan editorial:
${revisionInstruction}

Petikan bab:
${sourceExcerpt}

Isi bab semasa:
${JSON.stringify(sourceContent, null, 2)}

Pulangkan JSON sahaja:
{
  "title": "string",
  "excerpt": "string",
  "content": ["perenggan panjang", "perenggan panjang"],
  "editorNote": "string"
}

Peraturan:
- Semua hasil mesti dalam Bahasa Melayu semula jadi.
- Jangan tiru mana-mana karya atau penulis tertentu.
- Kekalkan rasa web novel komersial: konflik jelas, emosi kuat, pacing episodik, dan hook akhir.
- Jika mod ialah "continue", tambah bab dengan kesinambungan semula jadi dan tingkatkan krisis.
- Jika mod ialah "rewrite", hasil akhir mesti lebih kemas, lebih intensif, dan lebih meyakinkan.
- Jika mod ialah "expand", hasil akhir mesti lebih panjang daripada teks asal dan menambah lapisan adegan.
- Minimum 14 perenggan naratif panjang.
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
    const parsed = JSON.parse(extractJsonObject(raw)) as Omit<GeneratedChapterRevision, "wordCount" | "mode">;
    const data: GeneratedChapterRevision = {
      ...parsed,
      mode,
      wordCount: estimateWordCount(parsed.content),
    };

    const supabase = getSupabaseAdminClient();
    const { saved, saveError } = await saveGenerationJob(
      supabase,
      `chapter_${mode}`,
      {
        bookTitle,
        chapterTitle,
        chapterLengthGoal,
        revisionInstruction,
      },
      data,
    );

    if (supabase) {
      await supabase.from("chapter_drafts").insert({
        book_title: bookTitle,
        chapter_number: 0,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        word_count: data.wordCount,
        seo_payload: {
          mode,
          editorNote: data.editorNote,
          sourceChapterTitle: chapterTitle,
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
