import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");

  if (!isAuthorizedAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  const { data: dueChapters, error } = await supabase
    .from("chapters")
    .select("id, book_id, chapter_number")
    .eq("is_published", false)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dueChapters || dueChapters.length === 0) {
    return NextResponse.json({ ok: true, published: 0 });
  }

  const chapterIds = dueChapters.map((chapter) => chapter.id);

  const { error: publishError } = await supabase
    .from("chapters")
    .update({
      is_published: true,
      published_at: nowIso,
      published_at_label: new Date().toLocaleDateString("ms-MY"),
    })
    .in("id", chapterIds);

  if (publishError) {
    return NextResponse.json({ error: publishError.message }, { status: 500 });
  }

  await supabase.from("generation_jobs").insert({
    job_type: "scheduled_publish",
    input_payload: { nowIso },
    output_payload: {
      chapterIds,
      count: chapterIds.length,
    },
    status: "completed",
  });

  return NextResponse.json({ ok: true, published: chapterIds.length });
}
