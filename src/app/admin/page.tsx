import Link from "next/link";
import { AdminGenerator } from "@/components/admin/generator";

export default function AdminPage() {
  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">中文后台</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
              小说生成与运营工作台
            </h1>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/admin/library" className="text-[var(--accent-deep)] underline underline-offset-4">
              打开书库管理
            </Link>
            <Link href="/" className="text-[var(--accent-deep)] underline underline-offset-4">
              返回前台首页
            </Link>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
          这个后台现在分成两层：上面是“一键生成并发布”的简化模式，适合快速上书；下面是高级模式，保留完整的圣经、大纲、章节和封面精修流程。界面操作说明用中文，AI 产出的标题、简介、章节、封面提示词仍然保持马来语，方便直接上站。
        </p>

        <section className="mt-8">
          <AdminGenerator />
        </section>
      </div>
    </main>
  );
}
