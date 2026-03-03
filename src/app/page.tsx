import Link from "next/link";
import { getNovels } from "@/lib/content";
import type { Novel } from "@/lib/library";

const moodChips = [
  { label: "🔥 Balas Dendam", href: "#trending" },
  { label: "💔 Cinta Terlarang", href: "#trending" },
  { label: "🕵 Misteri Gelap", href: "#ranking" },
  { label: "💰 Jadi Kaya Cepat", href: "#genres" },
  { label: "😈 Suami Curang", href: "#trending" },
  { label: "🧠 Plot Twist Gila", href: "#ranking" },
];

const genreLinks = [
  { label: "Romansa 🔥", href: "#trending" },
  { label: "Misteri 🕵", href: "#trending" },
  { label: "Fantasi 🧙", href: "#trending" },
  { label: "Dendam 😈", href: "#trending" },
  { label: "Kaya Cepat 💰", href: "#ranking" },
  { label: "Kampung Seram 🌧", href: "#ranking" },
];

const gradients = [
  "from-fuchsia-600 via-rose-500 to-orange-500",
  "from-orange-500 via-red-500 to-pink-600",
  "from-sky-500 via-cyan-400 to-teal-300",
];

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

function getLiveReaders(novels: Novel[]) {
  return novels.reduce((sum, novel, index) => {
    return sum + Math.round(parseCompactNumber(novel.metrics.readers) * (0.18 + index * 0.02));
  }, 0);
}

function getDailyChapters(novels: Novel[]) {
  return novels.reduce((sum, novel) => sum + Math.max(1, Math.min(novel.chapters.length, 3)), 0) + 74;
}

function getGrowthCount(novels: Novel[]) {
  return Math.max(4, Math.min(9, novels.length + 1));
}

function getComments(novel: Novel, index: number) {
  return Math.round(parseCompactNumber(novel.metrics.saved) * 0.55 + (index + 1) * 120);
}

function getWeeklyGrowth(novel: Novel, index: number) {
  return 128 + index * 37 + novel.chapters.length * 2;
}

function getCountdownParts() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(19, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

function CoverThumb({
  novel,
  gradient,
  compact = false,
}: {
  novel: Novel;
  gradient: string;
  compact?: boolean;
}) {
  if (novel.coverThumbnailUrl || novel.coverImageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-[24px] ${compact ? "h-32" : "h-64"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={novel.coverThumbnailUrl ?? novel.coverImageUrl}
          alt={`Sampul ${novel.title}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a]/30 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br ${gradient} ${compact ? "h-32" : "h-64"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,0.25),transparent_22%),radial-gradient(circle_at_18%_80%,rgba(255,255,255,0.18),transparent_20%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b0f1a]/90 to-transparent" />
    </div>
  );
}

export default async function HomePage() {
  const novels = await getNovels();
  const featured = novels.slice(0, 3);
  const trending = novels.slice(0, 6);
  const tonight = novels.slice(0, 6);
  const [hours, minutes, seconds] = getCountdownParts();
  const liveReaders = getLiveReaders(novels);
  const dailyChapters = getDailyChapters(novels);
  const growthCount = getGrowthCount(novels);

  const byReads = [...novels].sort(
    (left, right) => parseCompactNumber(right.metrics.readers) - parseCompactNumber(left.metrics.readers),
  );
  const byComments = [...novels].sort((left, right) => getComments(right, 0) - getComments(left, 0));
  const byGrowth = [...novels].sort((left, right) => getWeeklyGrowth(right, 0) - getWeeklyGrowth(left, 0));

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0F1A]/88 backdrop-blur-xl">
        <div className="page-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-semibold tracking-[-0.04em] text-white">
              CerekaAI
            </Link>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-300 lg:hidden">
              <Link href="#trending">🔥 Trending</Link>
              <Link href="#ranking">🏆 Rank</Link>
            </div>
          </div>

          <div className="flex-1 lg:max-w-xl">
            <label className="block">
              <span className="sr-only">Cari cerita</span>
              <input
                type="search"
                placeholder="Cari cerita: balas dendam, cinta terlarang, misteri..."
                className="w-full rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/25"
              />
            </label>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-300 lg:flex">
            <Link href="#trending" className="transition hover:text-white">
              🔥 Trending
            </Link>
            <Link href="#ranking" className="transition hover:text-white">
              🏆 Rank
            </Link>
            <Link href="#genres" className="transition hover:text-white">
              🎭 Genre
            </Link>
            <Link href="/admin/library" className="transition hover:text-white">
              Ikut / Rak
            </Link>
          </nav>
        </div>
      </header>

      <div className="page-shell pb-20 pt-6 md:pb-24 md:pt-8">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#FDBA74]">
              Platform cerita malam
            </p>
            <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.9] tracking-[-0.05em] text-white md:text-7xl">
              Cerita yang buat kau lupa dunia sebenar.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              Bab baru setiap malam jam 7. Ribuan pembaca sedang baca sekarang.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={featured[0] ? `/novels/${featured[0].slug}` : "#trending"}
                className="rounded-full bg-[#F97316] px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition hover:scale-[1.02] hover:bg-[#fb923c]"
              >
                🔥 Mula Baca Sekarang
              </Link>
              <Link
                href="#ranking"
                className="rounded-full border border-white/10 bg-white/6 px-7 py-4 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                📈 Lihat Ranking
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px]">
            <div className="absolute right-12 top-10 h-44 w-44 rounded-full bg-[#EF4444]/18 blur-3xl" />
            <div className="absolute left-10 top-24 h-48 w-48 rounded-full bg-[#8B5CF6]/18 blur-3xl" />
            <div className="absolute bottom-10 right-20 h-40 w-40 rounded-full bg-[#06B6D4]/15 blur-3xl" />

            <div className="relative mx-auto mt-6 h-[380px] w-full max-w-[420px]">
              {featured.map((novel, index) => {
                const comments = getComments(novel, index);
                const reads = parseCompactNumber(novel.metrics.readers) + 20000 + index * 1500;
                const topOffset = index * 34;
                const rightOffset = index * 16;

                return (
                  <article
                    key={novel.slug}
                    className="absolute w-[88%] rounded-[32px] border border-white/10 bg-[#111827]/90 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
                    style={{
                      top: `${topOffset}px`,
                      right: `${rightOffset}px`,
                      transform: `rotate(${index === 0 ? "-4deg" : index === 1 ? "3deg" : "-2deg"})`,
                      zIndex: 20 - index,
                    }}
                  >
                    <CoverThumb novel={novel} gradient={gradients[index % gradients.length]} compact />
                    <div className="mt-4">
                      <h2 className="text-2xl font-semibold leading-tight text-white">{novel.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{novel.hook}</p>
                      <div className="mt-4 grid gap-2 text-sm text-slate-200">
                        <p>👁 {formatCompact(reads)} baca minggu ini</p>
                        <p>💬 {formatCompact(comments)} komen</p>
                        <p className="font-semibold text-[#FB7185]">🔥 Sedang trending</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-x-auto">
          <div className="flex min-w-max gap-3 rounded-[24px] border border-white/10 bg-white/5 p-3">
            <LiveStatPill text={`🔥 ${liveReaders.toLocaleString("en-US")} orang sedang baca sekarang`} />
            <LiveStatPill text={`🔥 ${dailyChapters.toLocaleString("en-US")} bab baru diterbitkan hari ini`} />
            <LiveStatPill text={`🔥 ${growthCount} cerita naik 200% minggu ini`} />
          </div>
        </section>

        <section id="trending" className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F97316]">Trending</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                🔥 Trending Hari Ini
              </h2>
            </div>
            <p className="hidden max-w-md text-sm leading-7 text-slate-400 md:block">
              Cerita paling laju naik, paling banyak dibaca, dan paling banyak dibincang malam ini.
            </p>
          </div>

          <div className="mt-7 flex gap-5 overflow-x-auto pb-2">
            {trending.map((novel, index) => (
              <article
                key={novel.slug}
                className="min-w-[290px] flex-1 rounded-[30px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:scale-[1.02] hover:border-white/20"
              >
                <CoverThumb novel={novel} gradient={gradients[index % gradients.length]} />
                <div className="mt-4">
                  <h3 className="text-2xl font-semibold leading-tight text-white">{novel.title}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{novel.hook}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-300">
                    <span>👁 {novel.metrics.readers}</span>
                    <span>💬 {formatCompact(getComments(novel, index))}</span>
                    <span>📈 +{getWeeklyGrowth(novel, index)}%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-[#EF4444]/12 px-3 py-1 text-xs font-semibold text-[#F87171]">
                      {index === 2 ? "Tamat" : "Masih berjalan"}
                    </span>
                    <Link
                      href={`/novels/${novel.slug}`}
                      className="text-sm font-semibold text-[#FDBA74] transition hover:text-white"
                    >
                      Baca sekarang →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(249,115,22,0.08),rgba(17,24,39,0.92))] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F97316]">Mood Finder</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
              Hari ini kau nak rasa apa?
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moodChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(249,115,22,0.08)] transition hover:border-[#F97316]/40 hover:bg-[#F97316]/10 hover:shadow-[0_0_32px_rgba(249,115,22,0.18)]"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(11,15,26,0.95))] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F97316]">Update Ritual</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">🕰 Bab Baru Jam 7 Malam</h2>
            <div className="mt-6 flex items-center gap-3 text-5xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              <span>{hours}</span>
              <span className="text-[#F97316]">:</span>
              <span>{minutes}</span>
              <span className="text-[#F97316]">:</span>
              <span>{seconds}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">Cerita yang akan update malam ini</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tonight.map((novel, index) => (
              <article key={novel.slug} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-3 inline-flex rounded-full bg-[#EF4444]/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F87171]">
                  +1 Bab Malam Ini
                </div>
                <CoverThumb novel={novel} gradient={gradients[index % gradients.length]} compact />
                <h3 className="mt-4 text-lg font-semibold text-white">{novel.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{novel.updateTime}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ranking" className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F97316]">Ranking</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">🏆 Ranking</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-7 text-slate-400 md:block">
              没有排名感，爽文平台就不够热。这里直接给读者看最火、最会吵、涨最快。
            </p>
          </div>

          <div className="mt-7 grid gap-5 xl:grid-cols-3">
            <RankingColumn
              title="Paling Banyak Dibaca"
              novels={byReads.slice(0, 3)}
              valueFor={(novel) => `👁 ${novel.metrics.readers}`}
            />
            <RankingColumn
              title="Paling Banyak Komen"
              novels={byComments.slice(0, 3)}
              valueFor={(novel, index) => `💬 ${formatCompact(getComments(novel, index))}`}
            />
            <RankingColumn
              title="Naik Paling Laju"
              novels={byGrowth.slice(0, 3)}
              valueFor={(novel, index) => `📈 +${getWeeklyGrowth(novel, index)}%`}
            />
          </div>
        </section>

        <section id="genres" className="mt-14">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F97316]">Genre</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
              Cari ikut rasa, bukan ikut kategori kaku.
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {genreLinks.map((genre) => (
                <Link
                  key={genre.label}
                  href={genre.href}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  {genre.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(249,115,22,0.12),rgba(11,15,26,0.96))] p-8 text-center shadow-[0_26px_80px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#F97316]">Last Push</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            Jangan berhenti malam ini.
          </h2>
          <Link
            href={featured[0] ? `/novels/${featured[0].slug}` : "#trending"}
            className="mt-7 inline-flex rounded-full bg-[#F97316] px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition hover:scale-[1.02] hover:bg-[#fb923c]"
          >
            🔥 Teruskan membaca
          </Link>
        </section>
      </div>
    </main>
  );
}

function LiveStatPill({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-200">
      {text}
    </div>
  );
}

function RankingColumn({
  title,
  novels,
  valueFor,
}: {
  title: string;
  novels: Novel[];
  valueFor: (novel: Novel, index: number) => string;
}) {
  return (
    <article className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <div className="mt-5 space-y-3">
        {novels.map((novel, index) => (
          <Link
            key={`${title}-${novel.slug}`}
            href={`/novels/${novel.slug}`}
            className="flex items-center gap-4 rounded-[22px] border border-white/8 bg-[#111827]/70 px-4 py-4 transition hover:border-white/15 hover:bg-[#172033]"
          >
            <div className="text-3xl font-semibold tracking-[-0.04em] text-[#F97316]">#{index + 1}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-white">{novel.title}</p>
              <p className="mt-1 text-sm text-slate-400">{valueFor(novel, index)}</p>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}
