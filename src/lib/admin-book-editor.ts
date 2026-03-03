import { cache } from "react";
import { getSupabaseAdminClient } from "@/lib/supabase";

export type EditableChapter = {
  id: string;
  chapterNumber: number;
  title: string;
  excerpt: string;
  content: string[];
  publishedAtLabel: string;
  isPublished: boolean;
};

export type EditableBook = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  genre: string;
  status: string;
  updateTime: string;
  synopsis: string;
  hook: string;
  audience: string;
  tags: string[];
  coverImageUrl?: string;
  coverThumbnailUrl?: string;
  coverTone: string;
  chapters: EditableChapter[];
};

export const getEditableBook = cache(async (bookId: string): Promise<EditableBook | null> => {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("books")
    .select(
      `
        id,
        slug,
        title,
        tagline,
        genre,
        status,
        update_time,
        synopsis,
        hook,
        audience,
        tags,
        cover_image_url,
        cover_thumbnail_url,
        cover_tone,
        chapters (
          id,
          chapter_number,
          title,
          excerpt,
          content,
          published_at_label,
          is_published
        )
      `,
    )
    .eq("id", bookId)
    .single();

  if (error || !data) {
    return null;
  }

  const chapters =
    ((data as typeof data & {
      chapters?: Array<{
        id: string;
        chapter_number: number;
        title: string;
        excerpt: string;
        content: string[];
        published_at_label: string;
        is_published: boolean;
      }>;
    }).chapters ?? [])
      .slice()
      .sort((left, right) => left.chapter_number - right.chapter_number)
      .map((chapter) => ({
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        title: chapter.title,
        excerpt: chapter.excerpt,
        content: Array.isArray(chapter.content) ? chapter.content : [],
        publishedAtLabel: chapter.published_at_label,
        isPublished: chapter.is_published,
      }));

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    tagline: data.tagline,
    genre: data.genre,
    status: data.status,
    updateTime: data.update_time,
    synopsis: data.synopsis,
    hook: data.hook,
    audience: data.audience,
    tags: data.tags ?? [],
    coverImageUrl: data.cover_image_url ?? undefined,
    coverThumbnailUrl: data.cover_thumbnail_url ?? undefined,
    coverTone: data.cover_tone,
    chapters,
  };
});
