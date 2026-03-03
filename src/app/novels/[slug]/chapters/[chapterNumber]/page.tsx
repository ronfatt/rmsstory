import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverArt } from "@/components/novels/cover-art";
import { getChapterBySlug, getNovelBySlug, getRelatedNovels } from "@/lib/content";

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
  const relatedNovels = await getRelatedNovels(slug, 3);

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
          <div className="mb-8 grid gap-6 rounded-[28px] border border-[var(--border)] bg-white/68 p-5 md:grid-cols-[220px_1fr]">
            <CoverArt
              title={novel.title}
              tagline={novel.tagline}
              genre={novel.genre}
              coverTone={novel.coverTone}
              coverImageUrl={novel.coverThumbnailUrl ?? novel.coverImageUrl}
              className="min-h-[280px] rounded-[24px]"
              titleClassName="max-w-[10rem] text-3xl"
              taglineClassName="max-w-[11rem] text-sm"
            />
            <div className="self-center">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Sedang membaca</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">{novel.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{novel.hook}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {novel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

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

        <section className="mt-8 glass rounded-[34px] p-7 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Cadangan seterusnya</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Novel lain yang patut dicuba</h2>
            </div>
            <Link href="/" className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4">
              Lihat semua novel
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {relatedNovels.map((item) => (
              <article key={item.slug} className="rounded-[26px] border border-[var(--border)] bg-white/72 p-4">
                <CoverArt
                  title={item.title}
                  tagline={item.tagline}
                  genre={item.genre}
                  coverTone={item.coverTone}
                  coverImageUrl={item.coverThumbnailUrl ?? item.coverImageUrl}
                  className="min-h-[260px] rounded-[20px]"
                  titleClassName="max-w-[10rem] text-2xl"
                  taglineClassName="max-w-[11rem] text-sm"
                />
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.synopsis}</p>
                <Link
                  href={`/novels/${item.slug}`}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
                >
                  Buka novel
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
