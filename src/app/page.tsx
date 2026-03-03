import Link from "next/link";
import { CoverArt } from "@/components/novels/cover-art";
import { getNovels } from "@/lib/content";

const categories = [
  {
    title: "Romansa harian",
    description: "Kisah cinta yang dibina untuk pembaca yang suka menunggu satu bab setiap malam.",
  },
  {
    title: "Misteri keluarga",
    description: "Rahsia lama, konflik warisan, dan kampung yang menyimpan terlalu banyak diam.",
  },
  {
    title: "Fantasi bersiri",
    description: "Dunia rekaan berbahasa Melayu yang mudah diikuti tetapi cukup besar untuk ketagihan.",
  },
];

const pipeline = [
  "Setiap novel dibina dengan bible cerita, profil watak, dan pelan 30 bab sebelum penerbitan.",
  "Bab baru dijadualkan harian supaya platform sentiasa terasa hidup dan konsisten.",
  "Nada bahasa, istilah, dan kesinambungan disemak semula sebelum bab diterbitkan.",
];

export default async function HomePage() {
  const novels = await getNovels();
  const featured = novels[0];

  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[rgba(255,251,247,0.82)] px-6 py-8 shadow-[var(--shadow)] md:px-10 md:py-12">
          <div className="grain absolute inset-0 rounded-[36px]" />
          <div className="relative grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
                Platform novel AI dalam Bahasa Melayu
              </p>
              <h1 className="max-w-xl text-5xl font-semibold leading-[0.94] tracking-[-0.04em] text-[var(--accent-deep)] md:text-7xl">
                CerekaAI untuk pembaca yang datang semula esok.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)] md:text-lg">
                Fokus pada siri harian, identiti visual yang kemas, dan pengalaman membaca yang terasa seperti platform novel premium, bukan dump kandungan automatik.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/novels/${featured.slug}`}
                  className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)]"
                >
                  Baca novel pilihan
                </Link>
                <a
                  href="#koleksi"
                  className="rounded-full border border-[var(--border)] bg-white/70 px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
                >
                  Lihat koleksi
                </a>
              </div>
            </div>
            <div className="grid gap-4 md:justify-self-end">
              <div className="glass rounded-[28px] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Sorotan hari ini</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">{featured.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{featured.tagline}</p>
                <div className="mt-5 space-y-2 text-sm text-[var(--foreground)]">
                  <p>{featured.metrics.readers}</p>
                  <p>{featured.metrics.updates}</p>
                  <p>{featured.updateTime}</p>
                </div>
              </div>
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--olive)] px-5 py-4 text-[var(--accent-soft)]">
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">Cadangan MVP</p>
                <p className="mt-2 text-sm leading-7 text-white/88">
                  Mulakan dengan 10 judul, 3 genre utama, dan stok sekurang-kurangnya 14 bab sebelum lancar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <article key={category.title} className="glass rounded-[28px] p-6">
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent)]">Genre fokus</p>
              <h3 className="mt-4 text-2xl font-semibold text-[var(--accent-deep)]">{category.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
            </article>
          ))}
        </section>

        <section id="koleksi" className="mt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Koleksi permulaan</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[var(--accent-deep)]">
                Judul yang terasa berbeza, bukan ulang formula yang sama.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[var(--muted)]">
              Setiap judul mempunyai identiti genre, warna sampul, dan ritma penerbitan yang tersendiri.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {novels.map((novel) => (
              <article key={novel.slug} className="glass rounded-[30px] p-5">
                <CoverArt
                  title={novel.title}
                  tagline={novel.tagline}
                  genre={novel.genre}
                  coverTone={novel.coverTone}
                  coverImageUrl={novel.coverImageUrl}
                  className="rounded-[24px] min-h-[320px]"
                  titleClassName="max-w-[12rem] text-3xl"
                  taglineClassName="max-w-[13rem] text-sm"
                />
                <div className="mt-5">
                  <p className="text-sm leading-7 text-[var(--muted)]">{novel.synopsis}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {novel.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">{novel.metrics.updates}</span>
                    <Link
                      href={`/novels/${novel.slug}`}
                      className="font-semibold text-[var(--accent-deep)] underline decoration-[var(--accent)] underline-offset-4"
                    >
                      Buka novel
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[32px] border border-[var(--border)] bg-[var(--olive)] p-7 text-white shadow-[var(--shadow)]">
            <p className="text-xs uppercase tracking-[0.28em] text-white/58">Sistem editorial</p>
            <h2 className="mt-4 text-3xl font-semibold">Cara hasilkan novel AI yang masih terasa rapi.</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-white/82">
              {pipeline.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>

          <article className="glass rounded-[32px] p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Halaman seterusnya</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--accent-deep)]">Selepas MVP ini siap</h2>
            <div className="mt-6 grid gap-4 text-sm leading-7 text-[var(--muted)] md:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                Jadual penerbitan automatik untuk membuka bab mengikut tarikh.
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                Dashboard editor untuk jana bible cerita, outline, dan stok bab.
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                Sistem langganan: baca percuma beberapa bab, kemudian buka premium.
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                Enjin cadangan berdasarkan genre, mood, dan tabiat pembaca.
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
