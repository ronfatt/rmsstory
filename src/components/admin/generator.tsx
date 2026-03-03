"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  GeneratedChapterDraft,
  GeneratedChapterOutline,
  GeneratedChapterRevision,
  GeneratedCoverConcept,
  GeneratedNovelBible,
} from "@/lib/admin";

type ResultEnvelope<T> = {
  data?: T;
  error?: string;
  raw?: string;
  saved?: boolean;
  saveError?: string;
  bibleId?: string;
  coverAssetId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
};

type QuickPublishResult = {
  published?: boolean;
  bibleId?: string;
  bookId?: string;
  slug?: string;
  title?: string;
  bible?: GeneratedNovelBible;
  outline?: GeneratedChapterOutline[];
  publishedChapterCount?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  warnings?: string[];
};

const initialPremise =
  "Seorang wanita miskin yang dihina keluarganya kembali ke bandar asal selepas kematian neneknya, lalu mendapati dia sebenarnya pewaris utama empayar keluarga yang kini cuba dirampas oleh lelaki yang pernah memusnahkan hidupnya.";
const adminTokenStorageKey = "rmsstory-admin-token";

export function AdminGenerator() {
  const [premise, setPremise] = useState(initialPremise);
  const [genre, setGenre] = useState("Romansa Drama / Warisan / Balas Dendam");
  const [tone, setTone] = useState("emosi tinggi, dramatik, ketagihan, cliffhanger keras");
  const [audience, setAudience] = useState("pembaca wanita 18-40 yang suka web novel panjang");
  const [updateCadence, setUpdateCadence] = useState("1 bab sehari");
  const [totalChapters, setTotalChapters] = useState("24");
  const [chapterLengthGoal, setChapterLengthGoal] = useState("3200-4500 patah perkataan");
  const [previousSummary, setPreviousSummary] = useState(
    "Watak utama baru kembali ke rumah lama dan menyedari ada wasiat yang disembunyikan.",
  );
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(adminTokenStorageKey) ?? "";
  });
  const [selectedChapter, setSelectedChapter] = useState("1");
  const [bibleResult, setBibleResult] = useState<ResultEnvelope<GeneratedNovelBible>>({});
  const [outlineResult, setOutlineResult] = useState<ResultEnvelope<GeneratedChapterOutline[]>>({});
  const [draftResult, setDraftResult] = useState<ResultEnvelope<GeneratedChapterDraft>>({});
  const [revisionResult, setRevisionResult] = useState<ResultEnvelope<GeneratedChapterRevision>>({});
  const [coverResult, setCoverResult] = useState<ResultEnvelope<GeneratedCoverConcept>>({});
  const [revisionMode, setRevisionMode] = useState<"continue" | "rewrite" | "expand">("rewrite");
  const [revisionInstruction, setRevisionInstruction] = useState(
    "Jadikan bab ini lebih dramatik, lebih panjang, lebih emosional, dan lebih ketagihan seperti web novel bersiri premium.",
  );
  const [workingTitle, setWorkingTitle] = useState("Bab 1");
  const [workingExcerpt, setWorkingExcerpt] = useState("");
  const [workingContent, setWorkingContent] = useState("");
  const [coverDirection, setCoverDirection] = useState(
    "watak utama dominan, aura mewah dan berbahaya, sinematik, kontras tinggi, susun atur sesuai untuk novel app",
  );
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverThumbnailUrl, setCoverThumbnailUrl] = useState("");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isBiblePending, startBibleTransition] = useTransition();
  const [isOutlinePending, startOutlineTransition] = useTransition();
  const [isDraftPending, startDraftTransition] = useTransition();
  const [isRevisionPending, startRevisionTransition] = useTransition();
  const [isCoverPending, startCoverTransition] = useTransition();
  const [isCoverSavePending, startCoverSaveTransition] = useTransition();
  const [isCoverAutoPending, startCoverAutoTransition] = useTransition();
  const [isCoverUploadPending, startCoverUploadTransition] = useTransition();
  const [quickResult, setQuickResult] = useState<ResultEnvelope<QuickPublishResult>>({});
  const [isQuickPending, startQuickTransition] = useTransition();

  useEffect(() => {
    if (adminToken.trim()) {
      window.localStorage.setItem(adminTokenStorageKey, adminToken);
      return;
    }

    window.localStorage.removeItem(adminTokenStorageKey);
  }, [adminToken]);

  async function postJson<T>(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as ResultEnvelope<T>;
    return { response, payload };
  }

  function handleQuickGenerate() {
    startQuickTransition(async () => {
      setQuickResult({});

      const { response, payload } = await postJson<QuickPublishResult>(
        "/api/admin/quick-generate-publish",
        {
          premise,
          genre,
          tone,
          audience,
          updateCadence,
          quickDraftChapters: 3,
          releaseHour: 19,
          releaseMinute: 0,
          timezone: "Asia/Kuala_Lumpur",
          coverDirection,
        },
      );

      if (!response.ok) {
        setQuickResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setQuickResult(payload);

      if (payload.data?.bible) {
        setBibleResult({
          data: payload.data.bible,
          saved: true,
          bibleId: payload.data.bibleId,
        });
      }

      if (payload.data?.outline) {
        setOutlineResult({
          data: payload.data.outline,
          saved: true,
        });
      }

      if (payload.data?.imageUrl) {
        setCoverImageUrl(payload.data.imageUrl);
      }

      if (payload.data?.thumbnailUrl) {
        setCoverThumbnailUrl(payload.data.thumbnailUrl);
      }
    });
  }

  function handleBibleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startBibleTransition(async () => {
      setBibleResult({});
      setOutlineResult({});
      setDraftResult({});

      const { response, payload } = await postJson<GeneratedNovelBible>(
        "/api/admin/generate-novel-bible",
        {
          premise,
          genre,
          tone,
          audience,
          updateCadence,
        },
      );

      if (!response.ok) {
        setBibleResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setBibleResult(payload);
    });
  }

  function handleOutlineGenerate() {
    if (!bibleResult.data) {
      return;
    }

    startOutlineTransition(async () => {
      setOutlineResult({});
      setDraftResult({});

      const { response, payload } = await postJson<GeneratedChapterOutline[]>(
        "/api/admin/generate-chapter-outline",
        {
          bible: bibleResult.data,
          bibleId: bibleResult.bibleId,
          totalChapters: Number(totalChapters),
          genre,
          chapterLengthGoal,
        },
      );

      if (!response.ok) {
        setOutlineResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setOutlineResult(payload);
      setSelectedChapter(String(payload.data?.[0]?.chapter ?? 1));
    });
  }

  function handleDraftGenerate() {
    if (!bibleResult.data || !outlineResult.data) {
      return;
    }

    const outline = outlineResult.data.find((item) => item.chapter === Number(selectedChapter));

    if (!outline) {
      return;
    }

    startDraftTransition(async () => {
      setDraftResult({});

      const { response, payload } = await postJson<GeneratedChapterDraft>(
        "/api/admin/generate-chapter-draft",
        {
          bible: bibleResult.data,
          bibleId: bibleResult.bibleId,
          outline,
          previousSummary,
          chapterLengthGoal,
        },
      );

      if (!response.ok) {
        setDraftResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setDraftResult(payload);
      if (payload.data) {
        setWorkingTitle(payload.data.title);
        setWorkingExcerpt(payload.data.excerpt);
        setWorkingContent(payload.data.content.join("\n\n"));
      }
    });
  }

  function handleRevisionGenerate() {
    const sourceContent = workingContent
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (sourceContent.length === 0) {
      return;
    }

    startRevisionTransition(async () => {
      setRevisionResult({});

      const { response, payload } = await postJson<GeneratedChapterRevision>(
        "/api/admin/revise-chapter-draft",
        {
          mode: revisionMode,
          bookTitle: bibleResult.data?.title ?? "Novel Tanpa Tajuk",
          chapterTitle: workingTitle,
          sourceExcerpt: workingExcerpt,
          sourceContent,
          revisionInstruction,
          chapterLengthGoal,
        },
      );

      if (!response.ok) {
        setRevisionResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setRevisionResult(payload);
      if (payload.data) {
        setWorkingTitle(payload.data.title);
        setWorkingExcerpt(payload.data.excerpt);
        setWorkingContent(payload.data.content.join("\n\n"));
      }
    });
  }

  function handleCoverGenerate() {
    if (!bibleResult.data) {
      return;
    }

    startCoverTransition(async () => {
      setCoverResult({});

      const { response, payload } = await postJson<GeneratedCoverConcept>(
        "/api/admin/generate-cover-prompt",
        {
          bible: bibleResult.data,
          bibleId: bibleResult.bibleId,
          genre,
          coverDirection,
        },
      );

      if (!response.ok) {
        setCoverResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setCoverResult(payload);
    });
  }

  function handleCoverAutoGenerate() {
    if (!bibleResult.data) {
      return;
    }

    startCoverAutoTransition(async () => {
      setCoverResult({});

      const { response, payload } = await postJson<GeneratedCoverConcept>(
        "/api/admin/generate-cover-asset",
        {
          bible: bibleResult.data,
          bibleId: bibleResult.bibleId,
          genre,
          coverDirection,
        },
      );

      if (!response.ok) {
        setCoverResult({ error: payload.error ?? "Failed to auto-generate cover." });
        return;
      }

      setCoverResult(payload);
      if (payload.imageUrl) {
        setCoverImageUrl(payload.imageUrl);
      }
      if (payload.thumbnailUrl) {
        setCoverThumbnailUrl(payload.thumbnailUrl);
      }
    });
  }

  function handleCoverSave() {
    const coverData = coverResult.data;

    if (!coverData) {
      return;
    }

    startCoverSaveTransition(async () => {
      const { response, payload } = await postJson<never>("/api/admin/save-cover-asset", {
        bibleId: bibleResult.bibleId,
        bookTitle: bibleResult.data?.title ?? "Novel Tanpa Tajuk",
        prompt: coverData.prompt,
        imageUrl: coverImageUrl,
        thumbnailUrl: coverThumbnailUrl,
        selected: true,
      });

      if (!response.ok) {
        setCoverResult((current) => ({
          ...current,
          error: payload.error ?? "Failed to save cover asset.",
        }));
        return;
      }

      setCoverResult((current) => ({
        ...current,
        saved: true,
        saveError: undefined,
        coverAssetId: payload.coverAssetId,
      }));
    });
  }

  function handleCoverUpload() {
    const coverData = coverResult.data;

    if (!replacementFile || !coverData) {
      return;
    }

    startCoverUploadTransition(async () => {
      const formData = new FormData();
      formData.append("file", replacementFile);
      formData.append("prompt", coverData.prompt);
      formData.append("bookTitle", bibleResult.data?.title ?? "Novel Tanpa Tajuk");
      formData.append("bibleId", bibleResult.bibleId ?? "");

      const response = await fetch("/api/admin/upload-cover-asset", {
        method: "POST",
        headers: {
          "x-admin-token": adminToken,
        },
        body: formData,
      });

      const payload = (await response.json()) as ResultEnvelope<never> & {
        imageUrl?: string;
        thumbnailUrl?: string;
      };

      if (!response.ok) {
        setCoverResult((current) => ({
          ...current,
          error: payload.error ?? "Failed to upload replacement cover.",
        }));
        return;
      }

      setCoverResult((current) => ({
        ...current,
        saved: true,
        saveError: undefined,
        coverAssetId: payload.coverAssetId,
      }));

      if (payload.imageUrl) {
        setCoverImageUrl(payload.imageUrl);
      }
      if (payload.thumbnailUrl) {
        setCoverThumbnailUrl(payload.thumbnailUrl);
      }
      setReplacementFile(null);
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">简化模式</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">快速生成一本书</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            这是你以后最常用的入口。填好核心设定后，系统会一次完成小说圣经、前 3 章、封面和发布，直接把新书送进首页，不需要再手动跳 6 个步骤。
          </p>

          <label className="mt-6 block text-sm font-semibold text-[var(--accent-deep)]">
            核心设定 / Premise
            <textarea
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              className="mt-2 min-h-36 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              题材方向
              <input
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              情绪和风格
              <input
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              目标读者
              <input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              更新节奏
              <input
                value={updateCadence}
                onChange={(event) => setUpdateCadence(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            后台口令
            <input
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="输入一次后会自动记住"
              className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
            />
          </label>

          <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-white/60 p-4 text-sm leading-7 text-[var(--muted)]">
            系统会自动执行：
            <br />
            1. 生成小说圣经
            <br />
            2. 生成前 3 章正文
            <br />
            3. 自动生成并挂载封面
            <br />
            4. 直接上架到首页
          </div>

          <button
            type="button"
            disabled={isQuickPending}
            onClick={handleQuickGenerate}
            className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:opacity-60"
          >
            {isQuickPending ? "正在一键生成并发布..." : "一键生成并发布到首页"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">快速结果</p>
          {!quickResult.data && !quickResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              这里会显示快速上架结果。成功后，你可以直接去首页和书库检查新书是否已经出现。
            </div>
          ) : null}

          {quickResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">错误：{quickResult.error}</p>
              {quickResult.raw ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{quickResult.raw}</pre>
              ) : null}
            </div>
          ) : null}

          {quickResult.data ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
                <p className="font-semibold">新书已经生成并发布。</p>
                <p className="mt-2">书名：{quickResult.data.title}</p>
                <p>已发布章节：{quickResult.data.publishedChapterCount ?? 0} 章</p>
                {quickResult.data.slug ? <p>书页地址：/novels/{quickResult.data.slug}</p> : null}
              </div>

              {quickResult.data.imageUrl ? <InfoCard title="已上架封面 URL" body={quickResult.data.imageUrl} /> : null}

              {quickResult.data.warnings?.length ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                  <p className="font-semibold">已完成，但有提醒：</p>
                  <div className="mt-3 space-y-2">
                    {quickResult.data.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </section>

      <details className="glass rounded-[32px] p-6" open={false}>
        <summary className="cursor-pointer list-none text-lg font-semibold text-[var(--accent-deep)]">
          打开高级模式
        </summary>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          只有在你需要精修时再展开这里。高级模式保留小说圣经、大纲、长章节、续写改写和封面替换的完整手动流程。
        </p>
        <div className="mt-6 space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={handleBibleSubmit} className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">功能区 1</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">小说圣经生成器</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            用这一块先确定一本书的核心卖点。输入题材、情绪、受众和核心设定后，系统会生成马来语标题、简介、标签、人物设定、SEO 文案和封面提示词。
          </p>

          <label className="mt-6 block text-sm font-semibold text-[var(--accent-deep)]">
            核心设定 / Premise
            <textarea
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              className="mt-2 min-h-36 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              题材方向
              <input
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              情绪和风格
              <input
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              目标读者
              <input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              更新节奏
              <input
                value={updateCadence}
                onChange={(event) => setUpdateCadence(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            后台口令
            <input
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={isBiblePending}
            className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:opacity-60"
          >
            {isBiblePending ? "生成中..." : "生成小说圣经"}
          </button>
        </form>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">输出结果</p>
          {!bibleResult.data && !bibleResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              这里会显示生成后的马来语标题、简介、剧情钩子、角色设定、SEO 文案和封面提示词。先把这一步打磨满意，再继续往下生成。
            </div>
          ) : null}

          {bibleResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">错误：{bibleResult.error}</p>
              {bibleResult.raw ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{bibleResult.raw}</pre>
              ) : null}
            </div>
          ) : null}

          {bibleResult.data ? (
            <div className="mt-5 space-y-5">
              <SaveBanner saved={bibleResult.saved} saveError={bibleResult.saveError} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <h3 className="text-3xl font-semibold text-[var(--accent-deep)]">{bibleResult.data.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{bibleResult.data.tagline}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{bibleResult.data.synopsis}</p>
              </div>

                <div className="grid gap-4 md:grid-cols-2">
                <InfoCard title="剧情钩子" body={bibleResult.data.hook} />
                <InfoCard title="目标读者" body={bibleResult.data.audience} />
                <InfoCard title="SEO title" body={bibleResult.data.seoTitle} />
                <InfoCard title="SEO description" body={bibleResult.data.seoDescription} />
              </div>

              <InfoCard title="推荐文案" body={bibleResult.data.recommendationCopy} />
              <InfoCard title="封面提示词" body={bibleResult.data.coverPrompt} />
              <InfoCard title="世界观摘要" body={bibleResult.data.worldSummary} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">标签</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {bibleResult.data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">主要角色</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {bibleResult.data.mainCharacters.map((character) => (
                    <div key={character.name} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <h4 className="text-lg font-semibold text-[var(--accent-deep)]">{character.name}</h4>
                      <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{character.role}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{character.conflict}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">功能区 2</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">章节大纲生成器</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            这一块负责把小说圣经扩成整本书的大纲。你可以控制章节总数和单章目标长度，先看整本书节奏够不够爽，再决定是否生成正文。
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              章节总数
              <input
                value={totalChapters}
                onChange={(event) => setTotalChapters(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              单章目标长度
              <input
                value={chapterLengthGoal}
                onChange={(event) => setChapterLengthGoal(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!bibleResult.data || isOutlinePending}
            onClick={handleOutlineGenerate}
            className="mt-6 rounded-full bg-[var(--olive)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isOutlinePending ? "生成中..." : "生成章节大纲"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">输出结果</p>
          {outlineResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">错误：{outlineResult.error}</p>
              {outlineResult.raw ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{outlineResult.raw}</pre>
              ) : null}
            </div>
          ) : null}

          {!outlineResult.data && !outlineResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              Selepas novel bible siap, jana outline 20 hingga 60 bab dengan beats yang cukup untuk bab web novel yang panjang.
              
            </div>
          ) : null}

          {outlineResult.data ? (
            <div className="mt-5 space-y-5">
              <SaveBanner saved={outlineResult.saved} saveError={outlineResult.saveError} />
              <div className="grid gap-4">
                {outlineResult.data.map((chapter) => (
                  <div key={chapter.chapter} className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Bab {chapter.chapter}</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--accent-deep)]">{chapter.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{chapter.focus}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Cliffhanger: {chapter.cliffhanger}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chapter.beats.map((beat) => (
                        <span
                          key={`${chapter.chapter}-${beat}`}
                          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--foreground)]"
                        >
                          {beat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">功能区 3</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">长章节正文生成器</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            这里是把某一章大纲直接写成长篇正文。适合先出初稿，再交给下一个区块做续写、改写或扩写。
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              选择章节
              <select
                value={selectedChapter}
                onChange={(event) => setSelectedChapter(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              >
                {outlineResult.data?.map((chapter) => (
                  <option key={chapter.chapter} value={chapter.chapter}>
                    Bab {chapter.chapter}: {chapter.title}
                  </option>
                )) ?? <option value="1">Bab 1</option>}
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              目标字数方向
              <input
                value={chapterLengthGoal}
                onChange={(event) => setChapterLengthGoal(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            前情提要
            <textarea
              value={previousSummary}
              onChange={(event) => setPreviousSummary(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <button
            type="button"
            disabled={!bibleResult.data || !outlineResult.data || isDraftPending}
            onClick={handleDraftGenerate}
            className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:opacity-60"
          >
            {isDraftPending ? "生成中..." : "生成长章节正文"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">输出结果</p>
          {draftResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">错误：{draftResult.error}</p>
              {draftResult.raw ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{draftResult.raw}</pre>
              ) : null}
            </div>
          ) : null}

          {!draftResult.data && !draftResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              Pilih satu outline bab untuk dijadikan draf panjang dengan dialog, emosi, konflik berlapis, dan cliffhanger yang kuat.
            </div>
          ) : null}

          {draftResult.data ? (
            <div className="mt-5 space-y-5">
              <SaveBanner saved={draftResult.saved} saveError={draftResult.saveError} />
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <h3 className="text-3xl font-semibold text-[var(--accent-deep)]">{draftResult.data.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{draftResult.data.excerpt}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--accent-deep)]">
                  预计长度：{draftResult.data.wordCount} 个词
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard title="SEO title" body={draftResult.data.seoTitle} />
                <InfoCard title="SEO description" body={draftResult.data.seoDescription} />
              </div>
              <InfoCard title="推荐文案" body={draftResult.data.recommendationCopy} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">章节段落</p>
                <div className="mt-4 space-y-4">
                  {draftResult.data.content.map((paragraph, index) => (
                    <p key={`${index + 1}-${paragraph.slice(0, 24)}`} className="text-sm leading-8 text-[var(--foreground)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">功能区 4</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">续写 / 改写 / 扩写</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            这个区块用来加工长章节初稿。续写是往后接，改写是提升质量，扩写是把章节拉长、补戏、补情绪。
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              编辑模式
              <select
                value={revisionMode}
                onChange={(event) =>
                  setRevisionMode(event.target.value as "continue" | "rewrite" | "expand")
                }
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              >
                <option value="continue">续写</option>
                <option value="rewrite">改写</option>
                <option value="expand">扩写</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              当前章节标题
              <input
                value={workingTitle}
                onChange={(event) => setWorkingTitle(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            当前摘要
            <textarea
              value={workingExcerpt}
              onChange={(event) => setWorkingExcerpt(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            编辑指令
            <textarea
              value={revisionInstruction}
              onChange={(event) => setRevisionInstruction(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            当前正文
            <textarea
              value={workingContent}
              onChange={(event) => setWorkingContent(event.target.value)}
              className="mt-2 min-h-72 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <button
            type="button"
            disabled={!workingContent.trim() || isRevisionPending}
            onClick={handleRevisionGenerate}
            className="mt-6 rounded-full bg-[var(--olive)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isRevisionPending ? "处理中..." : "执行编辑"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">输出结果</p>
          {revisionResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">错误：{revisionResult.error}</p>
              {revisionResult.raw ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{revisionResult.raw}</pre>
              ) : null}
            </div>
          ) : null}

          {!revisionResult.data && !revisionResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              Gunakan editor ini selepas satu bab draf siap. Anda boleh sambung, tulis semula, atau panjangkan bab untuk capai rasa web novel panjang.
            </div>
          ) : null}

          {revisionResult.data ? (
            <div className="mt-5 space-y-5">
              <SaveBanner saved={revisionResult.saved} saveError={revisionResult.saveError} />
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <h3 className="text-3xl font-semibold text-[var(--accent-deep)]">{revisionResult.data.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{revisionResult.data.excerpt}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--accent-deep)]">
                  预计长度：{revisionResult.data.wordCount} 个词
                </p>
              </div>

              <InfoCard title="编辑备注" body={revisionResult.data.editorNote} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">编辑后正文</p>
                <div className="mt-4 space-y-4">
                  {revisionResult.data.content.map((paragraph, index) => (
                    <p key={`${index + 1}-${paragraph.slice(0, 24)}`} className="text-sm leading-8 text-[var(--foreground)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">功能区 5</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">封面生成与替换</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            这里负责整本书的封面。你可以先只生成封面提示词，也可以直接自动生成图片并上架；如果之后不满意，还可以手动上传替换。
          </p>

          <label className="mt-6 block text-sm font-semibold text-[var(--accent-deep)]">
            封面视觉方向
            <textarea
              value={coverDirection}
              onChange={(event) => setCoverDirection(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              主图 URL
              <input
                value={coverImageUrl}
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              缩略图 URL
              <input
                value={coverThumbnailUrl}
                onChange={(event) => setCoverThumbnailUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!bibleResult.data || isCoverPending}
            onClick={handleCoverGenerate}
            className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:opacity-60"
          >
            {isCoverPending ? "生成中..." : "只生成封面提示词"}
          </button>

          <button
            type="button"
            disabled={!bibleResult.data || isCoverAutoPending}
            onClick={handleCoverAutoGenerate}
            className="mt-3 rounded-full bg-[var(--olive)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isCoverAutoPending ? "生成图片中..." : "自动生成并上架封面"}
          </button>

          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            你不需要再去别的地方单独做封面。系统已经支持后台一键自动出图并上架，也支持你之后从后台上传替换图。
          </p>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">输出结果</p>
          {coverResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">错误：{coverResult.error}</p>
              {coverResult.raw ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{coverResult.raw}</pre>
              ) : null}
            </div>
          ) : null}

          {!coverResult.data && !coverResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              Selepas novel bible siap, jana konsep sampul supaya setiap buku ada identiti visual yang menarik, jelas genre, dan sesuai untuk thumbnail kecil di aplikasi.
            </div>
          ) : null}

          {coverResult.data ? (
            <div className="mt-5 space-y-5">
              <SaveBanner saved={coverResult.saved} saveError={coverResult.saveError} />
              <InfoCard title="主提示词" body={coverResult.data.prompt} />
              <InfoCard title="备用提示词" body={coverResult.data.altPrompt} />
              <InfoCard title="视觉钩子" body={coverResult.data.visualHook} />
              <InfoCard title="标题处理建议" body={coverResult.data.titleTreatment} />
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">色盘建议</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {coverResult.data.palette.map((tone) => (
                    <span
                      key={tone}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--foreground)]"
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
              {coverImageUrl ? <InfoCard title="主图 URL" body={coverImageUrl} /> : null}
              {coverThumbnailUrl ? <InfoCard title="缩略图 URL" body={coverThumbnailUrl} /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  disabled={isCoverSavePending}
                  onClick={handleCoverSave}
                  className="rounded-full bg-[var(--olive)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {isCoverSavePending ? "保存中..." : "保存当前封面"}
                </button>

                <label className="rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--accent-deep)]">
                  上传替代封面
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm font-normal text-[var(--foreground)]"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!replacementFile || !coverResult.data || isCoverUploadPending}
                onClick={handleCoverUpload}
                className="rounded-full border border-[var(--border)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white disabled:opacity-60"
              >
                {isCoverUploadPending ? "上传中..." : "上传并替换封面"}
              </button>
            </div>
          ) : null}
        </section>
      </section>
        </div>
      </details>
    </div>
  );
}

function SaveBanner({
  saved,
  saveError,
}: {
  saved?: boolean;
  saveError?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 text-sm leading-7 ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      {saved
        ? "结果已经保存到 Supabase。"
        : "结果已生成，但当前环境没有完整服务端写入权限。"}
      {saveError ? ` 保存错误：${saveError}` : null}
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{body}</p>
    </div>
  );
}
