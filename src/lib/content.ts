import { cache } from "react";
import { novels as seedNovels, type Chapter, type Novel } from "@/lib/library";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";

type BookRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  genre: string;
  status: string;
  update_time: string;
  cover_tone: string;
  synopsis: string;
  hook: string;
  audience: string;
  tags: string[];
  readers_label: string;
  updates_label: string;
  saved_label: string;
};

type ChapterRow = {
  title: string;
  chapter_number: number;
  excerpt: string;
  content: string[];
  published_at_label: string;
};

function mapNovel(book: BookRow, chapters: ChapterRow[]): Novel {
  return {
    slug: book.slug,
    title: book.title,
    tagline: book.tagline,
    genre: book.genre,
    status: book.status,
    updateTime: book.update_time,
    coverTone: book.cover_tone,
    synopsis: book.synopsis,
    hook: book.hook,
    tags: book.tags,
    audience: book.audience,
    metrics: {
      readers: book.readers_label,
      updates: book.updates_label,
      saved: book.saved_label,
    },
    chapters: chapters.map((chapter) => ({
      number: chapter.chapter_number,
      title: chapter.title,
      publishedAt: chapter.published_at_label,
      excerpt: chapter.excerpt,
      content: chapter.content,
    })),
  };
}

const getRemoteNovels = cache(async (): Promise<Novel[] | null> => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = getSupabaseBrowserClient();

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
        cover_tone,
        synopsis,
        hook,
        audience,
        tags,
        readers_label,
        updates_label,
        saved_label,
        chapters (
          title,
          chapter_number,
          excerpt,
          content,
          published_at_label
        )
      `,
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .order("chapter_number", { foreignTable: "chapters", ascending: true });

  if (error || !data) {
    return null;
  }

  return data.map((item) =>
    mapNovel(item as BookRow, ((item as BookRow & { chapters: ChapterRow[] }).chapters ?? []) as ChapterRow[]),
  );
});

export const getNovels = cache(async (): Promise<Novel[]> => {
  const remote = await getRemoteNovels();

  if (remote && remote.length > 0) {
    return remote;
  }

  return seedNovels;
});

export async function getNovelBySlug(slug: string) {
  const allNovels = await getNovels();
  return allNovels.find((novel) => novel.slug === slug);
}

export async function getChapterBySlug(slug: string, chapterNumber: number): Promise<Chapter | undefined> {
  const novel = await getNovelBySlug(slug);
  return novel?.chapters.find((chapter) => chapter.number === chapterNumber);
}
