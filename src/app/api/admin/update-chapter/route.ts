import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminToken } from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase";

type UpdateChapterPayload = {
  chapterId?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  publishedAtLabel?: string;
  isPublished?: boolean;
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

  const body = (await request.json()) as UpdateChapterPayload;
  const chapterId = body.chapterId?.trim();
  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim();
  const content = body.content?.trim();
  const publishedAtLabel = body.publishedAtLabel?.trim();
  const isPublished = body.isPublished ?? true;

  if (!chapterId || !title || !excerpt || !content || !publishedAtLabel) {
    return NextResponse.json(
      { error: "chapterId, title, excerpt, content, publishedAtLabel are required." },
      { status: 400 },
    );
  }

  const normalizedContent = content
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("chapters")
    .update({
      title,
      excerpt,
      content: normalizedContent,
      published_at_label: publishedAtLabel,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chapterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("generation_jobs").insert({
    job_type: "update_chapter",
    input_payload: { chapterId, title },
    output_payload: { updated: true },
    status: "completed",
  });

  return NextResponse.json({ updated: true });
}
