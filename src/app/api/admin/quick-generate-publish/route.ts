import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  estimateWordCount,
  extractJsonObject,
  isAuthorizedAdminToken,
  type GeneratedChapterDraft,
  type GeneratedNovelBible,
} from "@/lib/admin";
import { persistSelectedCover, uploadCoverBinary } from "@/lib/cover-assets";
import { generateCoverConcept } from "@/lib/cover-prompt";
import { saveGenerationJob } from "@/lib/generation-store";
import { getOpenAIClient } from "@/lib/openai";
import { formatScheduleLabel } from "@/lib/scheduling";
import { slugify } from "@/lib/slug";
import { getSupabaseAdminClient } from "@/lib/supabase";

type QuickPayload = {
  premise?: string;
  genre?: string;
  tone?: string;
  audience?: string;
  updateCadence?: string;
  quickDraftChapters?: number;
  releaseHour?: number;
  releaseMinute?: number;
  timezone?: string;
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

  const body = (await request.json()) as QuickPayload;
  const premise = body.premise?.trim();
  const genre = body.genre?.trim() || "Romansa Drama";
  const tone = body.tone?.trim() || "emosi tinggi, dramatik, ketagihan, cliffhanger keras";
  const audience = body.audience?.trim() || "pembaca novel bersiri Melayu";
  const updateCadence = body.updateCadence?.trim() || "1 bab sehari";
  const quickDraftChapters = Math.max(1, Math.min(body.quickDraftChapters ?? 3, 5));
  const releaseHour = Math.max(0, Math.min(body.releaseHour ?? 19, 23));
  const releaseMinute = Math.max(0, Math.min(body.releaseMinute ?? 0, 59));
  const timezone = body.timezone?.trim() || "Asia/Kuala_Lumpur";
  const coverDirection =
    body.coverDirection?.trim() ||
    "watak utama dominan, sinematik, premium, thumbnail-friendly, sangat kuat untuk tarik klik";

  if (!premise) {
    return NextResponse.json({ error: "Premise is required." }, { status: 400 });
  }

  const warnings: string[] = [];

  try {
    const biblePrompt = `
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

    const bibleResponse = await client.responses.create({
      model: "gpt-5-mini",
      input: biblePrompt,
    });

    const bibleRaw = bibleResponse.output_text?.trim();

    if (!bibleRaw) {
      return NextResponse.json({ error: "Model returned an empty bible response." }, { status: 502 });
    }

    const bible = JSON.parse(extractJsonObject(bibleRaw)) as GeneratedNovelBible;
    const { data: bibleRow, error: bibleError } = await supabase
      .from("book_bibles")
      .insert({
        title: bible.title,
        genre,
        premise,
        payload: bible,
      })
      .select("id")
      .single();

    if (bibleError || !bibleRow) {
      return NextResponse.json({ error: bibleError?.message || "Failed to create draft bible." }, { status: 500 });
    }

    const bibleId = bibleRow.id;

    await saveGenerationJob(
      supabase,
      "quick_novel_bible",
      { premise, genre, tone, audience, updateCadence },
      bible,
    );

    const outlineRows = bible.chapterOutline.map((chapter) => ({
      book_bible_id: bibleId,
      book_title: bible.title,
      chapter_number: chapter.chapter,
      title: chapter.title,
      focus: chapter.focus,
      cliffhanger: chapter.cliffhanger,
      beats: [],
    }));

    const { data: insertedOutlines, error: outlineError } = await supabase
      .from("chapter_outlines")
      .insert(outlineRows)
      .select("id, chapter_number, title, focus, cliffhanger, beats");

    if (outlineError) {
      return NextResponse.json({ error: outlineError.message }, { status: 500 });
    }

    const outlineIdByChapter = new Map<number, string>();
    for (const outline of insertedOutlines ?? []) {
      outlineIdByChapter.set(outline.chapter_number, outline.id);
    }

    const generatedDrafts: Array<GeneratedChapterDraft & { chapterNumber: number }> = [];

    for (const outline of bible.chapterOutline.slice(0, quickDraftChapters)) {
      const previousSummary =
        generatedDrafts.length === 0
          ? "Ini bab pembukaan. Perkenalkan dunia, konflik, dan tarikan emosi dengan jelas."
          : generatedDrafts[generatedDrafts.length - 1].excerpt;

      const chapterPrompt = `
Anda penulis novel bersiri Bahasa Melayu untuk pembaca yang suka bab sangat panjang seperti web novel komersial.

Objektif:
- Tulis satu bab penuh dan panjang dalam Bahasa Melayu semula jadi.
- Sasaran panjang: 2800-4200 patah perkataan.
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
- Sekurang-kurangnya 12 perenggan panjang.
- Setiap perenggan mesti bersifat naratif, bukan nota ringkas.
- Mesti ada sekurang-kurangnya 2 peningkatan konflik.
- Mesti ada 1 pendedahan atau putaran emosi.
- Penutup bab mesti kuat dan membuat pembaca mahu sambung segera.
`;

      const chapterResponse = await client.responses.create({
        model: "gpt-5-mini",
        input: chapterPrompt,
      });

      const chapterRaw = chapterResponse.output_text?.trim();

      if (!chapterRaw) {
        return NextResponse.json(
          { error: `Model returned an empty chapter response for Bab ${outline.chapter}.` },
          { status: 502 },
        );
      }

      const chapterParsed = JSON.parse(extractJsonObject(chapterRaw)) as Omit<
        GeneratedChapterDraft,
        "wordCount"
      >;
      const draft: GeneratedChapterDraft & { chapterNumber: number } = {
        ...chapterParsed,
        chapterNumber: outline.chapter,
        wordCount: estimateWordCount(chapterParsed.content),
      };

      generatedDrafts.push(draft);

      await supabase.from("chapter_drafts").insert({
        book_bible_id: bibleId,
        chapter_outline_id: outlineIdByChapter.get(outline.chapter) ?? null,
        book_title: bible.title,
        chapter_number: outline.chapter,
        title: draft.title,
        excerpt: draft.excerpt,
        content: draft.content,
        word_count: draft.wordCount,
        seo_payload: {
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          recommendationCopy: draft.recommendationCopy,
        },
      });
    }

    let imageUrl: string | undefined;
    let thumbnailUrl: string | undefined;

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
        warnings.push("封面自动生成没有返回图片，已先用占位封面上架。");
      } else {
        const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
        const uploaded = await uploadCoverBinary({
          supabase,
          fileName: `${bible.title}-${randomUUID()}.png`,
          bytes,
          contentType: "image/png",
        });

        imageUrl = uploaded.imageUrl;
        thumbnailUrl = uploaded.thumbnailUrl;

        await persistSelectedCover({
          supabase,
          bibleId,
          bookTitle: bible.title,
          prompt: concept.prompt,
          imageUrl,
          thumbnailUrl,
          selected: true,
        });
      }
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `封面自动生成失败：${error.message}`
          : "封面自动生成失败，已先用占位封面上架。",
      );
    }

    const slugBase = slugify(bible.title);
    let slug = slugBase || `novel-${bibleId.slice(0, 8)}`;

    const { data: existingBook } = await supabase
      .from("books")
      .select("id, slug")
      .eq("title", bible.title)
      .maybeSingle();

    if (existingBook?.slug) {
      slug = existingBook.slug;
    }

    const bookInput = {
      slug,
      title: bible.title,
      tagline: bible.tagline,
      genre,
      status: "Dikemas kini setiap hari",
      update_time: formatScheduleLabel(releaseHour, releaseMinute),
      cover_tone: "from-stone-300 via-zinc-500 to-stone-900",
      cover_image_url: imageUrl ?? null,
      cover_thumbnail_url: thumbnailUrl ?? null,
      synopsis: bible.synopsis,
      hook: bible.hook,
      audience: bible.audience,
      tags: bible.tags,
      readers_label: "Baru diterbitkan",
      updates_label: `${generatedDrafts.length} bab tersedia`,
      saved_label: "0 simpanan",
      is_published: true,
      published_at: new Date().toISOString(),
    };

    let bookId = existingBook?.id;

    if (bookId) {
      const { error } = await supabase.from("books").update(bookInput).eq("id", bookId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { data: insertedBook, error } = await supabase
        .from("books")
        .insert(bookInput)
        .select("id")
        .single();

      if (error || !insertedBook) {
        return NextResponse.json({ error: error?.message || "Failed to create book." }, { status: 500 });
      }

      bookId = insertedBook.id;
    }

    await supabase.from("chapters").delete().eq("book_id", bookId);
    await supabase.from("release_schedules").delete().eq("book_id", bookId);

    const { error: chaptersError } = await supabase.from("chapters").insert(
      generatedDrafts.map((draft, index) => ({
        book_id: bookId,
        chapter_number: draft.chapterNumber,
        title: draft.title,
        excerpt: draft.excerpt,
        content: draft.content,
        published_at_label: new Date().toLocaleDateString("ms-MY"),
        is_published: true,
        scheduled_for: null,
        published_at: new Date(Date.now() + index * 1000).toISOString(),
      })),
    );

    if (chaptersError) {
      return NextResponse.json({ error: chaptersError.message }, { status: 500 });
    }

    await supabase.from("release_schedules").insert({
      book_id: bookId,
      cadence: "daily",
      release_hour: releaseHour,
      release_minute: releaseMinute,
      timezone,
      active: true,
    });

    await saveGenerationJob(
      supabase,
      "quick_generate_publish",
      {
        premise,
        genre,
        tone,
        audience,
        updateCadence,
        quickDraftChapters,
        releaseHour,
        releaseMinute,
        timezone,
      },
      {
        bibleId,
        bookId,
        slug,
        imageUrl,
        thumbnailUrl,
        warnings,
      },
    );

    return NextResponse.json({
      data: {
        published: true,
        bibleId,
        bookId,
        slug,
        title: bible.title,
        bible,
        outline: insertedOutlines,
        publishedChapterCount: generatedDrafts.length,
        imageUrl,
        thumbnailUrl,
        warnings,
      },
      saved: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to complete quick generate and publish.",
      },
      { status: 500 },
    );
  }
}
