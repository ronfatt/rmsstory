import Link from "next/link";
import { notFound } from "next/navigation";
import { getNovelBySlug } from "@/lib/content";

type NovelPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NovelPage({ params }: NovelPageProps) {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);

  if (!novel) {
    notFound();
  }

  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <Link href="/" className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4">
          Kembali ke utama
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div className={`cover-card rounded-[34px] bg-gradient-to-br ${novel.coverTone} p-8 text-white shadow-[var(--shadow)]`}>
            <p className="text-xs uppercase tracking-[0.28em] text-white/72">{novel.genre}</p>
            <h1 className="mt-16 max-w-[14rem] text-5xl font-semibold leading-[1.02]">{novel.title}</h1>
            <p className="mt-4 max-w-[15rem] text-sm leading-7 text-white/84">{novel.tagline}</p>
            <div className="mt-10 space-y-2 text-sm text-white/85">
              <p>{novel.status}</p>
              <p>{novel.updateTime}</p>
              <p>{novel.metrics.readers}</p>
            </div>
          </div>

          <div className="glass rounded-[34px] p-7 md:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Butiran novel</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--accent-deep)]">
              {novel.hook}
            </h2>
            <p className="mt-6 text-base leading-8 text-[var(--muted)]">{novel.synopsis}</p>
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

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-[var(--border)] bg-white/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Pembaca</p>
                <p className="mt-2 text-lg font-semibold text-[var(--accent-deep)]">{novel.metrics.readers}</p>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-white/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Bab aktif</p>
                <p className="mt-2 text-lg font-semibold text-[var(--accent-deep)]">{novel.metrics.updates}</p>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-white/72 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Simpan</p>
                <p className="mt-2 text-lg font-semibold text-[var(--accent-deep)]">{novel.metrics.saved}</p>
              </div>
            </div>

            <p className="mt-8 rounded-[22px] border border-[var(--border)] bg-[var(--accent-soft)] px-5 py-4 text-sm leading-7 text-[var(--accent-deep)]">
              {novel.audience}
            </p>
          </div>
        </section>

        <section className="mt-10 glass rounded-[34px] p-7 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Senarai bab</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Ikuti siri dari bab pertama</h2>
            </div>
            <Link
              href={`/novels/${novel.slug}/chapters/${novel.chapters[0].number}`}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Mula membaca
            </Link>
          </div>

          <div className="mt-8 grid gap-4">
            {novel.chapters.map((chapter) => (
              <Link
                key={chapter.number}
                href={`/novels/${novel.slug}/chapters/${chapter.number}`}
                className="rounded-[24px] border border-[var(--border)] bg-white/72 p-5 transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                      Bab {chapter.number}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[var(--accent-deep)]">{chapter.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{chapter.publishedAt}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{chapter.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
