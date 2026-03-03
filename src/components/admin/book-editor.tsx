"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { EditableBook } from "@/lib/admin-book-editor";

const adminTokenStorageKey = "rmsstory-admin-token";

export function BookEditor({ book }: { book: EditableBook }) {
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(adminTokenStorageKey) ?? "";
  });
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [bookForm, setBookForm] = useState({
    title: book.title,
    tagline: book.tagline,
    genre: book.genre,
    status: book.status,
    updateTime: book.updateTime,
    synopsis: book.synopsis,
    hook: book.hook,
    audience: book.audience,
    tags: book.tags.join(", "),
    coverImageUrl: book.coverImageUrl ?? "",
    coverThumbnailUrl: book.coverThumbnailUrl ?? "",
  });
  const [chapters, setChapters] = useState(
    book.chapters.map((chapter) => ({
      ...chapter,
      contentText: chapter.content.join("\n\n"),
    })),
  );

  useEffect(() => {
    if (adminToken.trim()) {
      window.localStorage.setItem(adminTokenStorageKey, adminToken);
      return;
    }

    window.localStorage.removeItem(adminTokenStorageKey);
  }, [adminToken]);

  function saveBook() {
    startTransition(async () => {
      setFeedback("");

      const response = await fetch("/api/admin/update-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          bookId: book.id,
          ...bookForm,
          tags: bookForm.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(payload.error ?? "保存书籍资料失败。");
        return;
      }

      setFeedback("书籍资料已保存。");
    });
  }

  function saveChapter(chapterId: string) {
    const chapter = chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return;
    }

    startTransition(async () => {
      setFeedback("");

      const response = await fetch("/api/admin/update-chapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          chapterId,
          title: chapter.title,
          excerpt: chapter.excerpt,
          content: chapter.contentText,
          publishedAtLabel: chapter.publishedAtLabel,
          isPublished: chapter.isPublished,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(payload.error ?? `保存第 ${chapter.chapterNumber} 章失败。`);
        return;
      }

      setFeedback(`第 ${chapter.chapterNumber} 章已保存。`);
    });
  }

  return (
    <div className="space-y-8">
      <section className="glass rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">已发布编辑</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">{book.title}</h2>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/admin/library" className="text-[var(--accent-deep)] underline underline-offset-4">
              返回书库
            </Link>
            <Link href={`/novels/${book.slug}`} className="text-[var(--accent-deep)] underline underline-offset-4">
              打开前台书页
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              后台口令
              <input
                type="password"
                value={adminToken}
                onChange={(event) => setAdminToken(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--accent-deep)]">
                标题
                <input
                  value={bookForm.title}
                  onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--accent-deep)]">
                一句话卖点
                <input
                  value={bookForm.tagline}
                  onChange={(event) => setBookForm((current) => ({ ...current, tagline: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--accent-deep)]">
                题材
                <input
                  value={bookForm.genre}
                  onChange={(event) => setBookForm((current) => ({ ...current, genre: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--accent-deep)]">
                状态
                <input
                  value={bookForm.status}
                  onChange={(event) => setBookForm((current) => ({ ...current, status: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--accent-deep)]">
                更新时间文案
                <input
                  value={bookForm.updateTime}
                  onChange={(event) => setBookForm((current) => ({ ...current, updateTime: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--accent-deep)]">
                读者定位
                <input
                  value={bookForm.audience}
                  onChange={(event) => setBookForm((current) => ({ ...current, audience: event.target.value }))}
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>

            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              简介
              <textarea
                value={bookForm.synopsis}
                onChange={(event) => setBookForm((current) => ({ ...current, synopsis: event.target.value }))}
                className="mt-2 min-h-28 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              剧情钩子
              <textarea
                value={bookForm.hook}
                onChange={(event) => setBookForm((current) => ({ ...current, hook: event.target.value }))}
                className="mt-2 min-h-24 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              标签
              <input
                value={bookForm.tags}
                onChange={(event) => setBookForm((current) => ({ ...current, tags: event.target.value }))}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              主封面 URL
              <textarea
                value={bookForm.coverImageUrl}
                onChange={(event) => setBookForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
                className="mt-2 min-h-28 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              缩略图 URL
              <textarea
                value={bookForm.coverThumbnailUrl}
                onChange={(event) => setBookForm((current) => ({ ...current, coverThumbnailUrl: event.target.value }))}
                className="mt-2 min-h-28 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </label>
            <button
              type="button"
              disabled={isPending || !adminToken}
              onClick={saveBook}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              保存书籍资料
            </button>
          </div>
        </div>

        {feedback ? <p className="mt-4 text-sm text-[var(--accent-deep)]">{feedback}</p> : null}
      </section>

      <section>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">章节编辑</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">已发布章节</h2>
        </div>

        <div className="mt-6 space-y-5">
          {chapters.map((chapter) => (
            <article key={chapter.id} className="glass rounded-[28px] p-5">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-2xl font-semibold text-[var(--accent-deep)]">第 {chapter.chapterNumber} 章</h3>
                  <button
                    type="button"
                    disabled={isPending || !adminToken}
                    onClick={() => saveChapter(chapter.id)}
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    保存本章
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-[var(--accent-deep)]">
                    章节标题
                    <input
                      value={chapter.title}
                      onChange={(event) =>
                        setChapters((current) =>
                          current.map((item) =>
                            item.id === chapter.id ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="text-sm font-semibold text-[var(--accent-deep)]">
                    发布时间文案
                    <input
                      value={chapter.publishedAtLabel}
                      onChange={(event) =>
                        setChapters((current) =>
                          current.map((item) =>
                            item.id === chapter.id ? { ...item, publishedAtLabel: event.target.value } : item,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                  </label>
                </div>

                <label className="text-sm font-semibold text-[var(--accent-deep)]">
                  摘要
                  <textarea
                    value={chapter.excerpt}
                    onChange={(event) =>
                      setChapters((current) =>
                        current.map((item) =>
                          item.id === chapter.id ? { ...item, excerpt: event.target.value } : item,
                        ),
                      )
                    }
                    className="mt-2 min-h-24 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="text-sm font-semibold text-[var(--accent-deep)]">
                  正文
                  <textarea
                    value={chapter.contentText}
                    onChange={(event) =>
                      setChapters((current) =>
                        current.map((item) =>
                          item.id === chapter.id ? { ...item, contentText: event.target.value } : item,
                        ),
                      )
                    }
                    className="mt-2 min-h-72 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm leading-7 outline-none"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
