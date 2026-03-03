import { NextRequest, NextResponse } from "next/server";
import {
  extractJsonObject,
  isAuthorizedAdminToken,
  type GeneratedCoverConcept,
  type GeneratedNovelBible,
} from "@/lib/admin";
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

  const prompt = `
Anda art director untuk platform novel bersiri Bahasa Melayu.

Tugas anda ialah menghasilkan konsep sampul novel yang sangat menarik untuk klik.

Keperluan:
- Gaya visual mesti terasa premium, komersial, dramatik, dan jelas genre-nya.
- Jangan hasilkan prompt yang terlalu generik.
- Elakkan rujukan kepada karya, francais, atau artis tertentu.
- Pastikan prompt sesuai digunakan pada model imej moden.
- Cerita ini perlu terasa seperti web novel panjang yang ketagihan.
- Arah visual tambahan: ${coverDirection}
- Genre utama: ${genre}

Data novel:
${JSON.stringify(bible, null, 2)}

Pulangkan JSON sahaja:
{
  "prompt": "string",
  "altPrompt": "string",
  "visualHook": "string",
  "titleTreatment": "string",
  "palette": ["string", "string", "string"]
}
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
    const parsed = JSON.parse(extractJsonObject(raw)) as GeneratedCoverConcept;
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
      const { data } = await supabase
        .from("cover_assets")
        .insert({
          book_bible_id: body.bibleId ?? null,
          book_title: bible.title,
          prompt: parsed.prompt,
          status: "prompt_ready",
          selected: false,
        })
        .select("id")
        .single();

      coverAssetId = data?.id;
    }

    return NextResponse.json({ data: parsed, saved, saveError, coverAssetId });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response as JSON.", raw },
      { status: 502 },
    );
  }
}
