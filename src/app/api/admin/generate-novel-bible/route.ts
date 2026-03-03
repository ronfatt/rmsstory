import { NextRequest, NextResponse } from "next/server";
import { extractJsonObject, isAuthorizedAdminToken, type GeneratedNovelBible } from "@/lib/admin";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { getSupabaseAdminClient } from "@/lib/supabase";

type GeneratePayload = {
  premise?: string;
  genre?: string;
  tone?: string;
  audience?: string;
  updateCadence?: string;
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
  const premise = body.premise?.trim();
  const genre = body.genre?.trim() || "Romansa Drama";
  const tone = body.tone?.trim() || "emosi, komersial, mudah dibaca";
  const audience = body.audience?.trim() || "pembaca novel bersiri Melayu";
  const updateCadence = body.updateCadence?.trim() || "1 bab sehari";

  if (!premise) {
    return NextResponse.json({ error: "Premise is required." }, { status: 400 });
  }

  const prompt = `
Anda editor fiksyen digital untuk platform novel bersiri Bahasa Melayu.

Hasilkan satu "novel bible" yang komersial, jelas, dan sesuai untuk penerbitan harian.

Keperluan:
- Semua kandungan mesti dalam Bahasa Melayu yang semula jadi.
- Elakkan campuran bahasa Indonesia dan Inggeris yang tidak perlu.
- Fokus kepada pembaca umum yang sukakan bab pendek, emosi jelas, dan cliffhanger.
- Cerita mesti sesuai untuk kemas kini ${updateCadence}.
- Genre: ${genre}
- Nada: ${tone}
- Sasaran pembaca: ${audience}
- Premis utama: ${premise}

Pulangkan JSON sahaja dengan struktur berikut:
{
  "title": "string",
  "tagline": "string",
  "synopsis": "string",
  "hook": "string",
  "audience": "string",
  "tags": ["string", "string"],
  "seoTitle": "string",
  "seoDescription": "string",
  "recommendationCopy": "string",
  "coverPrompt": "string",
  "worldSummary": "string",
  "mainCharacters": [
    {
      "name": "string",
      "role": "string",
      "conflict": "string"
    }
  ],
  "chapterOutline": [
    {
      "chapter": 1,
      "title": "string",
      "focus": "string",
      "cliffhanger": "string"
    }
  ]
}

Berikan tepat 4 watak utama dan tepat 12 outline bab.
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
    const parsed = JSON.parse(extractJsonObject(raw)) as GeneratedNovelBible;
    const supabase = getSupabaseAdminClient();
    const { saved, saveError } = await saveGenerationJob(
      supabase,
      "novel_bible",
      {
        premise,
        genre,
        tone,
        audience,
        updateCadence,
      },
      parsed,
    );

    let bibleId: string | undefined;

    if (supabase) {
      const { data, error } = await supabase
        .from("book_bibles")
        .insert({
          title: parsed.title,
          genre,
          premise,
          payload: parsed,
        })
        .select("id")
        .single();

      if (!error) {
        bibleId = data.id;
      }
    }

    return NextResponse.json({ data: parsed, saved, saveError, bibleId });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response as JSON.", raw },
      { status: 502 },
    );
  }
}
