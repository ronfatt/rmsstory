import type { SupabaseClient } from "@supabase/supabase-js";

export function getCoverBucketName() {
  return process.env.SUPABASE_COVER_BUCKET || "covers";
}

export async function ensureCoverBucket(supabase: SupabaseClient) {
  const bucket = getCoverBucketName();
  const { data } = await supabase.storage.listBuckets();
  const exists = data?.some((item) => item.name === bucket);

  if (!exists) {
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
  }

  return bucket;
}

export async function uploadCoverBinary({
  supabase,
  fileName,
  bytes,
  contentType,
}: {
  supabase: SupabaseClient;
  fileName: string;
  bytes: Uint8Array;
  contentType: string;
}) {
  const bucket = await ensureCoverBucket(supabase);
  const safeName = fileName.replace(/[^a-z0-9-_.]/gi, "-").toLowerCase();
  const originalPath = `original/${safeName}`;
  const thumbnailPath = `thumb/${safeName}`;

  const originalUpload = await supabase.storage.from(bucket).upload(originalPath, bytes, {
    contentType,
    upsert: true,
  });

  if (originalUpload.error) {
    throw new Error(originalUpload.error.message);
  }

  const thumbUpload = await supabase.storage.from(bucket).upload(thumbnailPath, bytes, {
    contentType,
    upsert: true,
  });

  if (thumbUpload.error) {
    throw new Error(thumbUpload.error.message);
  }

  const originalUrl = supabase.storage.from(bucket).getPublicUrl(originalPath).data.publicUrl;
  const thumbnailUrl = supabase.storage.from(bucket).getPublicUrl(thumbnailPath).data.publicUrl;

  return {
    imageUrl: originalUrl,
    thumbnailUrl,
  };
}

export async function persistSelectedCover({
  supabase,
  bibleId,
  bookTitle,
  prompt,
  imageUrl,
  thumbnailUrl,
  selected = true,
}: {
  supabase: SupabaseClient;
  bibleId?: string;
  bookTitle: string;
  prompt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  selected?: boolean;
}) {
  const { data, error } = await supabase
    .from("cover_assets")
    .insert({
      book_bible_id: bibleId ?? null,
      book_title: bookTitle,
      prompt,
      image_url: imageUrl ?? null,
      thumbnail_url: thumbnailUrl ?? null,
      status: imageUrl ? "image_ready" : "prompt_ready",
      selected,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (selected) {
    await supabase
      .from("cover_assets")
      .update({ selected: false })
      .eq("book_title", bookTitle)
      .neq("id", data.id);

    await supabase
      .from("books")
      .update({
        cover_image_url: imageUrl ?? null,
        cover_thumbnail_url: thumbnailUrl ?? null,
      })
      .eq("title", bookTitle);
  }

  return { coverAssetId: data.id };
}
