import Link from "next/link";
import { AdminGenerator } from "@/components/admin/generator";

export default function AdminPage() {
  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Admin studio</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
              Generator untuk memulakan siri baharu.
            </h1>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/admin/library" className="text-[var(--accent-deep)] underline underline-offset-4">
              Lihat library
            </Link>
            <Link href="/" className="text-[var(--accent-deep)] underline underline-offset-4">
              Kembali ke laman utama
            </Link>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
          Halaman ini ialah backend minimum untuk menjana novel bible dalam Bahasa Melayu. Ia sesuai untuk langkah pertama sebelum anda tambah generator bab, editor kesinambungan, dan sistem simpan ke Supabase.
        </p>

        <section className="mt-8">
          <AdminGenerator />
        </section>
      </div>
    </main>
  );
}
