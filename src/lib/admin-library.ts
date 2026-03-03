import { cache } from "react";
import { getSupabaseAdminClient } from "@/lib/supabase";

export type AdminPublishedBook = {
  id: string;
  slug: string;
  title: string;
  genre: string;
  status: string;
  coverImageUrl?: string;
  coverThumbnailUrl?: string;
  chapterCount: number;
  publishedAt?: string;
  releaseHour?: number;
  releaseMinute?: number;
  releaseTimezone?: string;
  nextChapterCount: number;
};

export type AdminDraftBook = {
  id: string;
  title: string;
  genre: string;
  premise: string;
  coverImageUrl?: string;
  coverThumbnailUrl?: string;
  outlineCount: number;
  draftCount: number;
  createdAt: string;
};

export type AdminLibraryOverview = {
  publishedBooks: AdminPublishedBook[];
  draftBooks: AdminDraftBook[];
};

export const getAdminLibraryOverview = cache(async (): Promise<AdminLibraryOverview> => {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { publishedBooks: [], draftBooks: [] };
  }

  const [
    publishedResponse,
    draftResponse,
    selectedDraftCoversResponse,
    outlinesResponse,
    draftsResponse,
    schedulesResponse,
    upcomingChaptersResponse,
  ] = await Promise.all([
    supabase
      .from("books")
      .select("id, slug, title, genre, status, cover_image_url, cover_thumbnail_url, published_at, chapters(count)")
      .order("published_at", { ascending: false }),
    supabase
      .from("book_bibles")
      .select("id, title, genre, premise, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("cover_assets")
      .select("book_bible_id, image_url, thumbnail_url")
      .eq("selected", true),
    supabase
      .from("chapter_outlines")
      .select("book_bible_id"),
    supabase
      .from("chapter_drafts")
      .select("book_bible_id"),
    supabase
      .from("release_schedules")
      .select("book_id, release_hour, release_minute, timezone, active"),
    supabase
      .from("chapters")
      .select("book_id")
      .eq("is_published", false),
  ]);

  const scheduleMap = new Map(
    (schedulesResponse.data ?? [])
      .filter((item) => item.active)
      .map((item) => [
        item.book_id,
        {
          releaseHour: item.release_hour ?? undefined,
          releaseMinute: item.release_minute ?? undefined,
          releaseTimezone: item.timezone ?? undefined,
        },
      ]),
  );

  const nextChapterCountMap = new Map<string, number>();
  for (const row of upcomingChaptersResponse.data ?? []) {
    if (!row.book_id) {
      continue;
    }
    nextChapterCountMap.set(row.book_id, (nextChapterCountMap.get(row.book_id) ?? 0) + 1);
  }

  const publishedBooks =
    publishedResponse.data?.map((book) => ({
      id: book.id,
      slug: book.slug,
      title: book.title,
      genre: book.genre,
      status: book.status,
      coverImageUrl: book.cover_image_url ?? undefined,
      coverThumbnailUrl: book.cover_thumbnail_url ?? undefined,
      chapterCount: Array.isArray(book.chapters) ? Number(book.chapters[0]?.count ?? 0) : 0,
      publishedAt: book.published_at ?? undefined,
      nextChapterCount: nextChapterCountMap.get(book.id) ?? 0,
      ...scheduleMap.get(book.id),
    })) ?? [];

  const selectedDraftCovers = new Map(
    (selectedDraftCoversResponse.data ?? [])
      .filter((item) => item.book_bible_id)
      .map((item) => [
        item.book_bible_id as string,
        {
          coverImageUrl: item.image_url ?? undefined,
          coverThumbnailUrl: item.thumbnail_url ?? undefined,
        },
      ]),
  );

  const outlineCount = new Map<string, number>();
  for (const row of outlinesResponse.data ?? []) {
    if (!row.book_bible_id) {
      continue;
    }
    outlineCount.set(row.book_bible_id, (outlineCount.get(row.book_bible_id) ?? 0) + 1);
  }

  const draftCount = new Map<string, number>();
  for (const row of draftsResponse.data ?? []) {
    if (!row.book_bible_id) {
      continue;
    }
    draftCount.set(row.book_bible_id, (draftCount.get(row.book_bible_id) ?? 0) + 1);
  }

  const draftBooks =
    draftResponse.data?.map((book) => ({
      id: book.id,
      title: book.title,
      genre: book.genre,
      premise: book.premise,
      createdAt: book.created_at,
      outlineCount: outlineCount.get(book.id) ?? 0,
      draftCount: draftCount.get(book.id) ?? 0,
      ...selectedDraftCovers.get(book.id),
    })) ?? [];

  return { publishedBooks, draftBooks };
});
