import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase";

type UpdateBookPayload = {
  bookId?: string;
  title?: string;
  tagline?: string;
  genre?: string;
  status?: string;
  updateTime?: string;
  synopsis?: string;
  hook?: string;
  audience?: string;
  tags?: string[];
  coverImageUrl?: string;
  coverThumbnailUrl?: string;
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

  const body = (await request.json()) as UpdateBookPayload;
  const bookId = body.bookId?.trim();

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required." }, { status: 400 });
  }

  const title = body.title?.trim();
  const tagline = body.tagline?.trim();
  const genre = body.genre?.trim();
  const status = body.status?.trim();
  const updateTime = body.updateTime?.trim();
  const synopsis = body.synopsis?.trim();
  const hook = body.hook?.trim();
  const audience = body.audience?.trim();
  const tags = (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const coverImageUrl = body.coverImageUrl?.trim() || null;
  const coverThumbnailUrl = body.coverThumbnailUrl?.trim() || null;

  if (!title || !tagline || !genre || !status || !updateTime || !synopsis || !hook || !audience) {
    return NextResponse.json(
      { error: "title, tagline, genre, status, updateTime, synopsis, hook, audience are required." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("books")
    .update({
      title,
      tagline,
      genre,
      status,
      update_time: updateTime,
      synopsis,
      hook,
      audience,
      tags,
      cover_image_url: coverImageUrl,
      cover_thumbnail_url: coverThumbnailUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("generation_jobs").insert({
    job_type: "update_book_meta",
    input_payload: { bookId, title, genre, status, updateTime, tags },
    output_payload: { updated: true },
    status: "completed",
  });

  return NextResponse.json({ updated: true });
}
