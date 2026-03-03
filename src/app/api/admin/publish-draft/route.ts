import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { getSupabaseAdminClient } from "@/lib/supabase";

type PublishPayload = {
  bibleId?: string;
};

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");

  if (!isAuthorizedAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const body = (await request.json()) as PublishPayload;
  const bibleId = body.bibleId?.trim();

  if (!bibleId) {
    return NextResponse.json({ error: "bibleId is required." }, { status: 400 });
  }

  const { data: bibleRow, error: bibleError } = await supabase
    .from("book_bibles")
    .select("id, title, genre, premise, payload")
    .eq("id", bibleId)
    .single();

  if (bibleError || !bibleRow) {
    return NextResponse.json({ error: "Draft bible not found." }, { status: 404 });
  }

  const payload = bibleRow.payload as {
    tagline?: string;
    synopsis?: string;
    hook?: string;
    audience?: string;
    tags?: string[];
  };

  const { data: draftRows, error: draftError } = await supabase
    .from("chapter_drafts")
    .select("id, chapter_number, title, excerpt, content")
    .eq("book_bible_id", bibleId)
    .gt("chapter_number", 0)
    .order("chapter_number", { ascending: true })
    .order("created_at", { ascending: false });

  if (draftError) {
    return NextResponse.json({ error: draftError.message }, { status: 500 });
  }

  const latestDraftByChapter = new Map<number, (typeof draftRows)[number]>();
  for (const draft of draftRows ?? []) {
    if (!latestDraftByChapter.has(draft.chapter_number)) {
      latestDraftByChapter.set(draft.chapter_number, draft);
    }
  }

  const orderedDrafts = [...latestDraftByChapter.values()].sort(
    (left, right) => left.chapter_number - right.chapter_number,
  );

  if (orderedDrafts.length === 0) {
    return NextResponse.json({ error: "No chapter drafts found for this draft book." }, { status: 400 });
  }

  const { data: selectedCover } = await supabase
    .from("cover_assets")
    .select("image_url, thumbnail_url")
    .eq("book_bible_id", bibleId)
    .eq("selected", true)
    .maybeSingle();

  const slugBase = slugify(bibleRow.title);
  let slug = slugBase || `novel-${bibleId.slice(0, 8)}`;

  const { data: existingBook } = await supabase
    .from("books")
    .select("id, slug")
    .eq("title", bibleRow.title)
    .maybeSingle();

  if (existingBook?.slug) {
    slug = existingBook.slug;
  }

  const bookInput = {
    slug,
    title: bibleRow.title,
    tagline: payload.tagline || bibleRow.genre,
    genre: bibleRow.genre,
    status: "Dikemas kini setiap hari",
    update_time: "Bab baru setiap hari",
    cover_tone: "from-stone-300 via-zinc-500 to-stone-900",
    cover_image_url: selectedCover?.image_url ?? null,
    cover_thumbnail_url: selectedCover?.thumbnail_url ?? null,
    synopsis: payload.synopsis || bibleRow.premise,
    hook: payload.hook || bibleRow.premise,
    audience: payload.audience || "Pembaca novel bersiri Melayu",
    tags: payload.tags || [],
    readers_label: "Baru diterbitkan",
    updates_label: `${orderedDrafts.length} bab tersedia`,
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

  const { error: chaptersError } = await supabase.from("chapters").insert(
    orderedDrafts.map((draft) => ({
      book_id: bookId,
      chapter_number: draft.chapter_number,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      published_at_label: new Date().toLocaleDateString("ms-MY"),
      is_published: true,
      published_at: new Date().toISOString(),
    })),
  );

  if (chaptersError) {
    return NextResponse.json({ error: chaptersError.message }, { status: 500 });
  }

  await supabase.from("generation_jobs").insert({
    job_type: "publish_draft",
    input_payload: { bibleId },
    output_payload: { bookId, slug, chapterCount: orderedDrafts.length },
    status: "completed",
  });

  return NextResponse.json({
    published: true,
    bookId,
    slug,
    chapterCount: orderedDrafts.length,
  });
}
