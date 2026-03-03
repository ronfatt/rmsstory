import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase";

type UpdateDraftPayload = {
  bibleId?: string;
  title?: string;
  genre?: string;
  premise?: string;
  tags?: string[];
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

  const body = (await request.json()) as UpdateDraftPayload;
  const bibleId = body.bibleId?.trim();
  const title = body.title?.trim();
  const genre = body.genre?.trim();
  const premise = body.premise?.trim();
  const tags = (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean);

  if (!bibleId || !title || !genre || !premise) {
    return NextResponse.json({ error: "bibleId, title, genre, premise are required." }, { status: 400 });
  }

  const { data: bibleRow, error: bibleError } = await supabase
    .from("book_bibles")
    .select("payload")
    .eq("id", bibleId)
    .single();

  if (bibleError || !bibleRow) {
    return NextResponse.json({ error: "Draft bible not found." }, { status: 404 });
  }

  const payload = { ...(bibleRow.payload as Record<string, unknown>) };
  payload.title = title;
  payload.tags = tags;

  const fallbackSynopsis = typeof payload.synopsis === "string" && payload.synopsis.trim() ? payload.synopsis : premise;
  const fallbackHook = typeof payload.hook === "string" && payload.hook.trim() ? payload.hook : premise;
  payload.synopsis = fallbackSynopsis;
  payload.hook = fallbackHook;

  const { error: updateBibleError } = await supabase
    .from("book_bibles")
    .update({
      title,
      genre,
      premise,
      payload,
    })
    .eq("id", bibleId);

  if (updateBibleError) {
    return NextResponse.json({ error: updateBibleError.message }, { status: 500 });
  }

  await Promise.all([
    supabase.from("chapter_outlines").update({ book_title: title }).eq("book_bible_id", bibleId),
    supabase.from("chapter_drafts").update({ book_title: title }).eq("book_bible_id", bibleId),
    supabase.from("cover_assets").update({ book_title: title }).eq("book_bible_id", bibleId),
  ]);

  await supabase.from("generation_jobs").insert({
    job_type: "update_draft_meta",
    input_payload: { bibleId, title, genre, premise, tags },
    output_payload: { updated: true },
    status: "completed",
  });

  return NextResponse.json({ updated: true });
}
