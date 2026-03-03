import Link from "next/link";
import { CoverArt } from "@/components/novels/cover-art";
import { getAdminLibraryOverview } from "@/lib/admin-library";

export default async function AdminLibraryPage() {
  const { publishedBooks, draftBooks } = await getAdminLibraryOverview();

  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Admin library</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
              Buku yang sudah terbit dan draft yang sedang dibina.
            </h1>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/admin" className="text-[var(--accent-deep)] underline underline-offset-4">
              Kembali ke studio
            </Link>
            <Link href="/" className="text-[var(--accent-deep)] underline underline-offset-4">
              Laman utama
            </Link>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">已生成书籍</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Koleksi yang sudah ada di depan pembaca</h2>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">{publishedBooks.length} judul diterbitkan</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {publishedBooks.map((book) => (
              <article key={book.id} className="glass rounded-[30px] p-5">
                <CoverArt
                  title={book.title}
                  tagline={book.status}
                  genre={book.genre}
                  coverTone="from-stone-300 via-zinc-500 to-stone-900"
                  coverImageUrl={book.coverThumbnailUrl ?? book.coverImageUrl}
                  className="min-h-[280px] rounded-[24px]"
                  titleClassName="max-w-[12rem] text-3xl"
                  taglineClassName="max-w-[13rem] text-sm"
                />
                <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                  <p>{book.chapterCount} bab terbit</p>
                  <p>{book.status}</p>
                </div>
                <Link
                  href={`/novels/${book.slug}`}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
                >
                  Buka halaman buku
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">草稿书籍</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Buku yang sudah dijana tetapi belum dipublish</h2>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">{draftBooks.length} draft aktif</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {draftBooks.map((book) => (
              <article key={book.id} className="glass rounded-[30px] p-5">
                <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                  <CoverArt
                    title={book.title}
                    tagline={book.genre}
                    genre="Draft"
                    coverTone="from-orange-200 via-amber-400 to-red-700"
                    coverImageUrl={book.coverThumbnailUrl ?? book.coverImageUrl}
                    className="min-h-[300px] rounded-[24px]"
                    titleClassName="max-w-[11rem] text-2xl"
                    taglineClassName="max-w-[11rem] text-sm"
                  />
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--accent-deep)]">{book.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{book.premise}</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <StatCard label="Genre" value={book.genre} />
                      <StatCard label="Outline" value={`${book.outlineCount} bab`} />
                      <StatCard label="Draft" value={`${book.draftCount} versi`} />
                    </div>
                    <p className="mt-5 text-sm text-[var(--muted)]">
                      Dijana pada {new Date(book.createdAt).toLocaleDateString("ms-MY")}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-white/75 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--accent-deep)]">{value}</p>
    </div>
  );
}
