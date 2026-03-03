import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverArt } from "@/components/novels/cover-art";
import { getNovelBySlug } from "@/lib/content";

type NovelPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function parseCompactNumber(label: string) {
  const match = label.match(/(\d+(?:\.\d+)?)\s*([kKmM]?)/);

  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const suffix = match[2].toLowerCase();

  if (suffix === "m") {
    return Math.round(value * 1_000_000);
  }

  if (suffix === "k") {
    return Math.round(value * 1_000);
  }

  return Math.round(value);
}

function formatCompact(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return String(value);
}

export default async function NovelPage({ params }: NovelPageProps) {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);

  if (!novel) {
    notFound();
  }

  const firstChapter = novel.chapters[0];
  const latestChapter = novel.chapters[novel.chapters.length - 1];
  const commentsCount = Math.round(parseCompactNumber(novel.metrics.saved) * 0.82);
  const chapterCount = novel.chapters.length;
  const totalPlannedChapters = Math.max(chapterCount + 12, 30);
  const topComments = [
    {
      name: "Mira87",
      text: "Aku baru baca tiga bab dah terus rasa nak marah dekat semua orang dalam keluarga dia.",
    },
    {
      name: "NoraReads",
      text: "Kalau penulis simpan rahsia besar macam ini, aku memang tunggu bab malam ini sampai habis.",
    },
    {
      name: "AfiqPlot",
      text: "Hook dia padu. Jenis cerita yang sekali mula, terus susah nak berhenti.",
    },
  ];

  return (
    <main className="pb-28 pt-8 md:pb-24">
      <div className="page-shell">
        <Link href="/" className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4">
          Kembali ke utama
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
          <div className="rounded-[34px] shadow-[var(--shadow)]">
            <CoverArt
              title={novel.title}
              tagline={novel.tagline}
              genre={novel.genre}
              coverTone={novel.coverTone}
              coverImageUrl={novel.coverImageUrl}
              className="min-h-[520px] rounded-[34px]"
              titleClassName="max-w-[14rem] text-5xl"
              taglineClassName="max-w-[15rem] text-sm"
            />
          </div>

          <div className="glass rounded-[34px] p-7 md:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Butiran novel</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--accent-deep)] md:text-5xl">
              {novel.title}
            </h1>
            <p className="mt-5 text-lg font-semibold leading-8 text-[var(--accent-deep)]">
              {novel.hook}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[var(--muted)]">
              <span className="rounded-full border border-[var(--border)] bg-white/75 px-4 py-2">
                👁 {novel.metrics.readers}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white/75 px-4 py-2">
                💬 {formatCompact(commentsCount)} komen
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white/75 px-4 py-2">
                ❤️ {novel.metrics.saved}
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/novels/${novel.slug}/chapters/${firstChapter.number}`}
                className="min-w-[240px] rounded-full bg-[var(--accent)] px-7 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_45px_rgba(177,77,24,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]"
              >
                🔥 Mula Baca Sekarang
              </Link>
              <button
                type="button"
                className="rounded-full border border-[var(--border)] bg-white/82 px-7 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
              >
                📌 Simpan ke Rak
              </button>
            </div>

            <div className="mt-7 grid gap-3 rounded-[24px] border border-[var(--border)] bg-white/75 p-5 text-sm font-semibold text-[var(--foreground)] md:grid-cols-3">
              <p>📖 Bab {latestChapter.number} daripada {totalPlannedChapters}</p>
              <p>🟢 {novel.status}</p>
              <p>🕰 {novel.updateTime}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {novel.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-6 text-base leading-8 text-[var(--muted)]">{novel.synopsis}</p>
          </div>
        </section>

        <section className="mt-10 glass rounded-[34px] p-7 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Apa kata pembaca?</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">💬 Apa kata pembaca?</h2>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">
              Reaksi awal pembaca yang suka cerita begini.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {topComments.map((comment) => (
              <article key={comment.name} className="rounded-[24px] border border-[var(--border)] bg-white/75 p-5">
                <p className="text-sm font-semibold text-[var(--accent-deep)]">{comment.name}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{comment.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 glass rounded-[34px] p-7 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Senarai bab</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">📚 Mula dari Bab 1</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/novels/${novel.slug}/chapters/${firstChapter.number}`}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
              >
                Mula dari Bab 1
              </Link>
              <Link
                href={`/novels/${novel.slug}/chapters/${latestChapter.number}`}
                className="rounded-full border border-[var(--border)] bg-white/82 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Sambung Bab Terakhir
              </Link>
            </div>
          </div>

          <div className="mt-8 divide-y divide-[var(--border)] overflow-hidden rounded-[26px] border border-[var(--border)] bg-white/76">
            {novel.chapters.map((chapter) => (
              <Link
                key={chapter.number}
                href={`/novels/${novel.slug}/chapters/${chapter.number}`}
                className="block px-5 py-5 transition hover:bg-white"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--accent-deep)]">Bab {chapter.number}</p>
                    <h3 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{chapter.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{chapter.publishedAt}</p>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{chapter.excerpt}</p>
                  </div>
                  <span className="mt-4 text-sm font-semibold text-[var(--accent-deep)] md:mt-0">
                    Baca →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[rgba(255,247,240,0.94)] px-4 py-3 backdrop-blur md:hidden">
        <div className="page-shell">
          <Link
            href={`/novels/${novel.slug}/chapters/${firstChapter.number}`}
            className="block rounded-full bg-[var(--accent)] px-6 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_45px_rgba(177,77,24,0.28)]"
          >
            🔥 Mula Baca Sekarang
          </Link>
        </div>
      </div>
    </main>
  );
}
