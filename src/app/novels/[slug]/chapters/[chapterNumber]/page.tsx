import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterBySlug, getNovelBySlug } from "@/lib/content";

type ChapterPageProps = {
  params: Promise<{
    slug: string;
    chapterNumber: string;
  }>;
};

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, chapterNumber } = await params;
  const novel = await getNovelBySlug(slug);
  const chapter = await getChapterBySlug(slug, Number(chapterNumber));

  if (!novel || !chapter) {
    notFound();
  }

  const previousChapter = novel.chapters.find((item) => item.number === chapter.number - 1);
  const nextChapter = novel.chapters.find((item) => item.number === chapter.number + 1);

  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--accent-deep)]">
          <Link href="/">Utama</Link>
          <span>/</span>
          <Link href={`/novels/${novel.slug}`}>{novel.title}</Link>
          <span>/</span>
          <span>Bab {chapter.number}</span>
        </div>

        <article className="mt-6 glass rounded-[36px] px-6 py-8 md:px-12 md:py-12">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">{novel.genre}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--accent-deep)] md:text-5xl">
            Bab {chapter.number}: {chapter.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
            <span>{chapter.publishedAt}</span>
            <span>{novel.updateTime}</span>
          </div>

          <p className="mt-8 rounded-[20px] border border-[var(--border)] bg-[var(--accent-soft)] px-5 py-4 text-sm leading-7 text-[var(--accent-deep)]">
            {chapter.excerpt}
          </p>

          <div className="reading-content mt-8">
            {chapter.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[var(--border)] pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              {previousChapter ? (
                <Link
                  href={`/novels/${novel.slug}/chapters/${previousChapter.number}`}
                  className="rounded-full border border-[var(--border)] bg-white/78 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Bab sebelumnya
                </Link>
              ) : null}
              {nextChapter ? (
                <Link
                  href={`/novels/${novel.slug}/chapters/${nextChapter.number}`}
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Bab seterusnya
                </Link>
              ) : null}
            </div>
            <Link
              href={`/novels/${novel.slug}`}
              className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
            >
              Lihat semua bab
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
