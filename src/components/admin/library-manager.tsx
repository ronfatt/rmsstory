"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CoverArt } from "@/components/novels/cover-art";
import type { AdminDraftBook, AdminPublishedBook } from "@/lib/admin-library";

const adminTokenStorageKey = "rmsstory-admin-token";

type LibraryManagerProps = {
  publishedBooks: AdminPublishedBook[];
  draftBooks: AdminDraftBook[];
};

export function LibraryManager({ publishedBooks, draftBooks }: LibraryManagerProps) {
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(adminTokenStorageKey) ?? "";
  });
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [view, setView] = useState<"all" | "published" | "drafts">("all");
  const [feedback, setFeedback] = useState<string>("");
  const [initialPublishedChapters, setInitialPublishedChapters] = useState("3");
  const [releaseHour, setReleaseHour] = useState("19");
  const [releaseMinute, setReleaseMinute] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState({
    title: "",
    genre: "",
    premise: "",
    tags: "",
  });

  useEffect(() => {
    if (adminToken.trim()) {
      window.localStorage.setItem(adminTokenStorageKey, adminToken);
      return;
    }

    window.localStorage.removeItem(adminTokenStorageKey);
  }, [adminToken]);

  const genres = useMemo(() => {
    const allGenres = [...publishedBooks.map((book) => book.genre), ...draftBooks.map((book) => book.genre)];
    return ["all", ...new Set(allGenres)];
  }, [draftBooks, publishedBooks]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPublished = publishedBooks.filter((book) => {
    if (genreFilter !== "all" && book.genre !== genreFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return `${book.title} ${book.genre} ${book.status}`.toLowerCase().includes(normalizedQuery);
  });

  const filteredDrafts = draftBooks.filter((book) => {
    if (genreFilter !== "all" && book.genre !== genreFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return `${book.title} ${book.genre} ${book.premise}`.toLowerCase().includes(normalizedQuery);
  });

  async function runAction(url: string, body: Record<string, string>, successMessage: string) {
    startTransition(async () => {
      setFeedback("");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as { error?: string; slug?: string };

      if (!response.ok) {
        setFeedback(payload.error ?? "Action failed.");
        return;
      }

      setFeedback(successMessage);
      window.location.reload();
    });
  }

  function openDraftEditor(book: AdminDraftBook) {
    setEditingDraftId(book.id);
    setDraftForm({
      title: book.title,
      genre: book.genre,
      premise: book.premise,
      tags: book.tags.join(", "),
    });
  }

  function handleDraftMetaSave(bookId: string) {
    startTransition(async () => {
      setFeedback("");

      const response = await fetch("/api/admin/update-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          bibleId: bookId,
          title: draftForm.title,
          genre: draftForm.genre,
          premise: draftForm.premise,
          tags: draftForm.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(payload.error ?? "保存草稿资料失败。");
        return;
      }

      setFeedback("草稿资料已保存。");
      setEditingDraftId(null);
      window.location.reload();
    });
  }

  function handleGenerateNextDraft(bookId: string, title: string) {
    startTransition(async () => {
      setFeedback("");

      const response = await fetch("/api/admin/generate-next-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          bibleId: bookId,
          chapterLengthGoal: "3200-4500 patah perkataan",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { chapterNumber?: number; title?: string; wordCount?: number };
      };

      if (!response.ok) {
        setFeedback(payload.error ?? "生成下一章失败。");
        return;
      }

      setFeedback(
        `《${title}》已生成第 ${payload.data?.chapterNumber ?? "?"} 章：${payload.data?.title ?? ""}`,
      );
      window.location.reload();
    });
  }

  return (
    <div className="space-y-8">
      <section className="glass rounded-[28px] p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索书名、题材、剧情设定"
            className="rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
          />
          <select
            value={genreFilter}
            onChange={(event) => setGenreFilter(event.target.value)}
            className="rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === "all" ? "全部题材" : genre}
              </option>
            ))}
          </select>
          <select
            value={view}
            onChange={(event) => setView(event.target.value as "all" | "published" | "drafts")}
            className="rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
          >
            <option value="all">全部状态</option>
            <option value="published">已上架</option>
            <option value="drafts">草稿箱</option>
          </select>
          <input
            type="password"
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            placeholder="输入后台口令后才能执行操作"
            className="rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="text-sm font-semibold text-[var(--accent-deep)]">
            首发章节数
            <input
              value={initialPublishedChapters}
              onChange={(event) => setInitialPublishedChapters(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--accent-deep)]">
            日更小时
            <input
              value={releaseHour}
              onChange={(event) => setReleaseHour(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--accent-deep)]">
            日更分钟
            <input
              value={releaseMinute}
              onChange={(event) => setReleaseMinute(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>
        <div className="mt-4">
          <button
            type="button"
            disabled={isPending || !adminToken}
            onClick={() =>
              runAction(
                "/api/admin/run-scheduled-publishing",
                {},
                "已执行一次定时发布检查，符合时间的章节会自动上架。",
              )
            }
            className="rounded-full border border-[var(--border)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
          >
            立即执行一次定时发布
          </button>
        </div>
        {!adminToken ? (
          <p className="mt-4 text-sm text-[var(--muted)]">先输入后台口令，发布、删除、归档这些按钮才会生效。</p>
        ) : null}
        {feedback ? <p className="mt-4 text-sm text-[var(--accent-deep)]">{feedback}</p> : null}
      </section>

      {view !== "drafts" ? (
        <section>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">已生成书籍</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">已上架作品</h2>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">当前结果 {filteredPublished.length} 本</p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {filteredPublished.map((book) => (
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
                  <p>已发布 {book.chapterCount} 章</p>
                  <p>{book.status}</p>
                  <p>
                    日更时间：
                    {book.releaseHour !== undefined
                      ? ` ${String(book.releaseHour).padStart(2, "0")}:${String(book.releaseMinute ?? 0).padStart(2, "0")}`
                      : " 未设置"}
                  </p>
                  <p>待自动发布：{book.nextChapterCount} 章</p>
                  <p>{book.publishedAt ? new Date(book.publishedAt).toLocaleDateString("ms-MY") : ""}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/novels/${book.slug}`}
                    className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
                  >
                    打开前台书页
                  </Link>
                  <Link
                    href={`/admin/library/${book.id}`}
                    className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
                  >
                    编辑资料
                  </Link>
                  <button
                    type="button"
                    disabled={isPending || !adminToken}
                    onClick={() =>
                      runAction(
                        "/api/admin/archive-book",
                        { bookId: book.id },
                        `《${book.title}》已归档。`,
                      )
                    }
                    className="text-sm font-semibold text-[var(--foreground)] underline underline-offset-4 disabled:opacity-60"
                  >
                    归档下架
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view !== "published" ? (
        <section>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">草稿书籍</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">待发布草稿</h2>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">当前结果 {filteredDrafts.length} 本</p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {filteredDrafts.map((book) => (
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
                      <StatCard label="题材" value={book.genre} />
                      <StatCard label="大纲" value={`${book.outlineCount} 章`} />
                      <StatCard label="草稿" value={`${book.draftCount} 份`} />
                    </div>
                    <p className="mt-5 text-sm text-[var(--muted)]">
                      创建于 {new Date(book.createdAt).toLocaleDateString("ms-MY")}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/admin?bibleId=${book.id}`}
                        className="rounded-full border border-[var(--border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                      >
                        继续生成
                      </Link>
                      <button
                        type="button"
                        disabled={isPending || !adminToken || !book.nextChapterNumber}
                        onClick={() => handleGenerateNextDraft(book.id, book.title)}
                        className="rounded-full border border-[var(--border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
                      >
                        {book.nextChapterNumber ? `生成第 ${book.nextChapterNumber} 章` : "没有下一章可生成"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          editingDraftId === book.id ? setEditingDraftId(null) : openDraftEditor(book)
                        }
                        className="rounded-full border border-[var(--border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
                      >
                        {editingDraftId === book.id ? "收起编辑" : "编辑草稿"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !adminToken}
                        onClick={() =>
                          runAction(
                            "/api/admin/publish-draft",
                            {
                              bibleId: book.id,
                              initialPublishedChapters,
                              releaseHour,
                              releaseMinute,
                              timezone: "Asia/Kuala_Lumpur",
                            },
                            `《${book.title}》已发布，并设置为每日 ${releaseHour}:${releaseMinute.padStart(2, "0")} 自动更新。`,
                          )
                        }
                        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        一键发布
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !adminToken}
                        onClick={() =>
                          runAction(
                            "/api/admin/delete-draft",
                            { bibleId: book.id },
                            `《${book.title}》草稿已删除。`,
                          )
                        }
                        className="rounded-full border border-[var(--border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
                      >
                        删除草稿
                      </button>
                    </div>
                    {editingDraftId === book.id ? (
                      <div className="mt-5 grid gap-4 rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                        <label className="text-sm font-semibold text-[var(--accent-deep)]">
                          标题
                          <input
                            value={draftForm.title}
                            onChange={(event) => setDraftForm((current) => ({ ...current, title: event.target.value }))}
                            className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/90 px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        <label className="text-sm font-semibold text-[var(--accent-deep)]">
                          题材
                          <input
                            value={draftForm.genre}
                            onChange={(event) => setDraftForm((current) => ({ ...current, genre: event.target.value }))}
                            className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/90 px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        <label className="text-sm font-semibold text-[var(--accent-deep)]">
                          简介 / 核心设定
                          <textarea
                            value={draftForm.premise}
                            onChange={(event) => setDraftForm((current) => ({ ...current, premise: event.target.value }))}
                            className="mt-2 min-h-32 w-full rounded-[20px] border border-[var(--border)] bg-white/90 px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        <label className="text-sm font-semibold text-[var(--accent-deep)]">
                          标签
                          <input
                            value={draftForm.tags}
                            onChange={(event) => setDraftForm((current) => ({ ...current, tags: event.target.value }))}
                            placeholder="豪门, 复仇, 遗产"
                            className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/90 px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={isPending || !adminToken}
                            onClick={() => handleDraftMetaSave(book.id)}
                            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            保存草稿资料
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setEditingDraftId(null)}
                            className="rounded-full border border-[var(--border)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-60"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
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
