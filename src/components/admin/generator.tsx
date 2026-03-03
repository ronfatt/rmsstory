"use client";

import { useState, useTransition } from "react";
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
};

const initialPremise =
  "Seorang wanita miskin yang dihina keluarganya kembali ke bandar asal selepas kematian neneknya, lalu mendapati dia sebenarnya pewaris utama empayar keluarga yang kini cuba dirampas oleh lelaki yang pernah memusnahkan hidupnya.";

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
  const [adminToken, setAdminToken] = useState("");
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
  const [isBiblePending, startBibleTransition] = useTransition();
  const [isOutlinePending, startOutlineTransition] = useTransition();
  const [isDraftPending, startDraftTransition] = useTransition();
  const [isRevisionPending, startRevisionTransition] = useTransition();
  const [isCoverPending, startCoverTransition] = useTransition();
  const [isCoverSavePending, startCoverSaveTransition] = useTransition();

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

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={handleBibleSubmit} className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Langkah 1</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Jana novel bible</h2>

          <label className="mt-6 block text-sm font-semibold text-[var(--accent-deep)]">
            Premis utama
            <textarea
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              className="mt-2 min-h-36 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Genre
              <input
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Nada
              <input
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Audiens
              <input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Kadar kemas kini
              <input
                value={updateCadence}
                onChange={(event) => setUpdateCadence(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            Admin token
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
            {isBiblePending ? "Menjana..." : "Jana novel bible"}
          </button>
        </form>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Output bible</p>
          {!bibleResult.data && !bibleResult.error ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
              Jana title, synopsis, hook, world summary, watak utama, SEO copy, dan prompt sampul dahulu.
            </div>
          ) : null}

          {bibleResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">Ralat: {bibleResult.error}</p>
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
                <InfoCard title="Hook" body={bibleResult.data.hook} />
                <InfoCard title="Audiens" body={bibleResult.data.audience} />
                <InfoCard title="SEO title" body={bibleResult.data.seoTitle} />
                <InfoCard title="SEO description" body={bibleResult.data.seoDescription} />
              </div>

              <InfoCard title="Cadangan promosi" body={bibleResult.data.recommendationCopy} />
              <InfoCard title="Prompt sampul" body={bibleResult.data.coverPrompt} />
              <InfoCard title="Dunia cerita" body={bibleResult.data.worldSummary} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Tag</p>
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
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Watak utama</p>
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
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Langkah 2</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Jana outline bab panjang</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Jumlah bab
              <input
                value={totalChapters}
                onChange={(event) => setTotalChapters(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Sasaran panjang
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
            {isOutlinePending ? "Menjana..." : "Jana outline bab"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Output outline</p>
          {outlineResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">Ralat: {outlineResult.error}</p>
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
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Langkah 3</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Jana bab super panjang</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Pilih bab
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
              Sasaran panjang
              <input
                value={chapterLengthGoal}
                onChange={(event) => setChapterLengthGoal(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            Ringkasan bab sebelumnya
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
            {isDraftPending ? "Menjana..." : "Jana bab penuh"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Output bab</p>
          {draftResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">Ralat: {draftResult.error}</p>
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
                  Anggaran panjang: {draftResult.data.wordCount} patah perkataan
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard title="SEO title" body={draftResult.data.seoTitle} />
                <InfoCard title="SEO description" body={draftResult.data.seoDescription} />
              </div>
              <InfoCard title="Cadangan promosi" body={draftResult.data.recommendationCopy} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Perenggan bab</p>
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
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Langkah 4</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">续写 / 改写 / 扩写</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Mod
              <select
                value={revisionMode}
                onChange={(event) =>
                  setRevisionMode(event.target.value as "continue" | "rewrite" | "expand")
                }
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              >
                <option value="continue">Sambung bab</option>
                <option value="rewrite">Tulis semula</option>
                <option value="expand">Panjangkan bab</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              Tajuk bab kerja
              <input
                value={workingTitle}
                onChange={(event) => setWorkingTitle(event.target.value)}
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            Excerpt kerja
            <textarea
              value={workingExcerpt}
              onChange={(event) => setWorkingExcerpt(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            Arahan editorial
            <textarea
              value={revisionInstruction}
              onChange={(event) => setRevisionInstruction(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[var(--accent-deep)]">
            Teks kerja
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
            {isRevisionPending ? "Memproses..." : "Jalankan editor"}
          </button>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Output editor</p>
          {revisionResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">Ralat: {revisionResult.error}</p>
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
                  Anggaran panjang: {revisionResult.data.wordCount} patah perkataan
                </p>
              </div>

              <InfoCard title="Nota editor" body={revisionResult.data.editorNote} />

              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Perenggan hasil</p>
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
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Langkah 5</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Konsep dan aset sampul</h2>

          <label className="mt-6 block text-sm font-semibold text-[var(--accent-deep)]">
            Arah visual
            <textarea
              value={coverDirection}
              onChange={(event) => setCoverDirection(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal text-[var(--foreground)] outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              URL imej utama
              <input
                value={coverImageUrl}
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-normal outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--accent-deep)]">
              URL thumbnail
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
            {isCoverPending ? "Menjana..." : "Jana konsep sampul"}
          </button>

          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Langkah ini menjana prompt dan arah visual. Imej sebenar masih boleh dibuat di tool lain, kemudian URL hasil akhir diisi semula di sini atau ke Supabase selepas itu.
          </p>
        </div>

        <section className="glass rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Output sampul</p>
          {coverResult.error ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
              <p className="font-semibold">Ralat: {coverResult.error}</p>
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
              <InfoCard title="Prompt utama" body={coverResult.data.prompt} />
              <InfoCard title="Prompt alternatif" body={coverResult.data.altPrompt} />
              <InfoCard title="Hook visual" body={coverResult.data.visualHook} />
              <InfoCard title="Rawatan tajuk" body={coverResult.data.titleTreatment} />
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Palet warna</p>
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
              {coverImageUrl ? <InfoCard title="URL imej utama" body={coverImageUrl} /> : null}
              {coverThumbnailUrl ? <InfoCard title="URL thumbnail" body={coverThumbnailUrl} /> : null}
              <button
                type="button"
                disabled={isCoverSavePending}
                onClick={handleCoverSave}
                className="rounded-full bg-[var(--olive)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isCoverSavePending ? "Menyimpan..." : "Simpan aset sampul"}
              </button>
            </div>
          ) : null}
        </section>
      </section>
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
        ? "Hasil ini telah disimpan ke Supabase."
        : "Hasil dijana, tetapi simpanan ke Supabase memerlukan service role key."}
      {saveError ? ` Ralat simpan: ${saveError}` : null}
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
