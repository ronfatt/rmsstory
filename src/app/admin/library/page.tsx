import Link from "next/link";
import { LibraryManager } from "@/components/admin/library-manager";
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
          <LibraryManager publishedBooks={publishedBooks} draftBooks={draftBooks} />
        </section>
      </div>
    </main>
  );
}
