import { NextRequest, NextResponse } from "next/server";
import {
  isAuthorizedAdminToken,
  type GeneratedChapterDraft,
  type GeneratedChapterOutline,
  type GeneratedNovelBible,
} from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");

  if (!isAuthorizedAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bibleId = request.nextUrl.searchParams.get("bibleId")?.trim();

  if (!bibleId) {
    return NextResponse.json({ error: "bibleId is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const [{ data: bibleRow, error: bibleError }, { data: outlineRows, error: outlineError }, { data: draftRows, error: draftError }, { data: coverRow, error: coverError }] =
    await Promise.all([
      supabase.from("book_bibles").select("id, premise, genre, payload").eq("id", bibleId).single(),
      supabase
        .from("chapter_outlines")
        .select("chapter_number, title, focus, cliffhanger, beats")
        .eq("book_bible_id", bibleId)
        .order("chapter_number", { ascending: true }),
      supabase
        .from("chapter_drafts")
        .select("chapter_number, title, excerpt, content, word_count, seo_payload, created_at")
        .eq("book_bible_id", bibleId)
        .order("chapter_number", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("cover_assets")
        .select("image_url, thumbnail_url")
        .eq("book_bible_id", bibleId)
        .eq("selected", true)
        .maybeSingle(),
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

  if (coverError) {
    return NextResponse.json({ error: coverError.message }, { status: 500 });
  }

  const bible = bibleRow.payload as GeneratedNovelBible;
  const outlines: GeneratedChapterOutline[] =
    outlineRows?.map((row) => ({
      chapter: row.chapter_number,
      title: row.title,
      focus: row.focus,
      cliffhanger: row.cliffhanger,
      beats: Array.isArray(row.beats) ? (row.beats as string[]) : [],
    })) ?? [];

  const latestDraftRow = draftRows?.[0];
  const latestDraft: GeneratedChapterDraft | null = latestDraftRow
    ? {
        title: latestDraftRow.title,
        excerpt: latestDraftRow.excerpt,
        content: Array.isArray(latestDraftRow.content) ? (latestDraftRow.content as string[]) : [],
        wordCount: latestDraftRow.word_count ?? 0,
        seoTitle: String((latestDraftRow.seo_payload as { seoTitle?: string } | null)?.seoTitle ?? ""),
        seoDescription: String(
          (latestDraftRow.seo_payload as { seoDescription?: string } | null)?.seoDescription ?? "",
        ),
        recommendationCopy: String(
          (latestDraftRow.seo_payload as { recommendationCopy?: string } | null)?.recommendationCopy ?? "",
        ),
      }
    : null;

  return NextResponse.json({
    data: {
      bibleId,
      premise: bibleRow.premise,
      genre: bibleRow.genre,
      bible,
      outlines,
      latestDraft,
      latestDraftChapter: latestDraftRow?.chapter_number ?? null,
      coverImageUrl: coverRow?.image_url ?? null,
      coverThumbnailUrl: coverRow?.thumbnail_url ?? null,
    },
  });
}
