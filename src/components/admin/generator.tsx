"use client";

import { useState, useTransition } from "react";
import type { GeneratedNovelBible } from "@/lib/admin";

type GenerateState = {
  data?: GeneratedNovelBible;
  error?: string;
  raw?: string;
  saved?: boolean;
  saveError?: string;
};

const initialPremise =
  "Seorang wanita pulang ke kampung untuk mengurus warisan keluarganya, lalu menemui perjanjian lama yang mengikat namanya kepada lelaki yang paling dia benci.";

export function AdminGenerator() {
  const [premise, setPremise] = useState(initialPremise);
  const [genre, setGenre] = useState("Romansa Drama");
  const [tone, setTone] = useState("emosi, komersial, cliffhanger lembut");
  const [audience, setAudience] = useState("pembaca wanita 18-35");
  const [updateCadence, setUpdateCadence] = useState("1 bab sehari");
  const [adminToken, setAdminToken] = useState("");
  const [result, setResult] = useState<GenerateState>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setResult({});

      const response = await fetch("/api/admin/generate-novel-bible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          premise,
          genre,
          tone,
          audience,
          updateCadence,
        }),
      });

      const payload = (await response.json()) as {
        data?: GeneratedNovelBible;
        error?: string;
        raw?: string;
        saved?: boolean;
        saveError?: string;
      };

      if (!response.ok) {
        setResult({ error: payload.error ?? "Request failed.", raw: payload.raw });
        return;
      }

      setResult({ data: payload.data, saved: payload.saved, saveError: payload.saveError });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={handleSubmit} className="glass rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Generator</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--accent-deep)]">Novel bible minimum</h2>

        <label className="mt-6 block text-sm font-semibold text-[var(--accent-deep)]">
          Premis
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
          disabled={isPending}
          className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:opacity-60"
        >
          {isPending ? "Menjana..." : "Jana novel bible"}
        </button>
      </form>

      <section className="glass rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Output</p>
        {!result.data && !result.error ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-6 text-sm leading-7 text-[var(--muted)]">
            Hasil akan muncul di sini selepas API menjana title, synopsis, hook, watak utama, dan outline 12 bab.
          </div>
        ) : null}

        {result.error ? (
          <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-800">
            <p className="font-semibold">Ralat: {result.error}</p>
            {result.raw ? <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs">{result.raw}</pre> : null}
          </div>
        ) : null}

        {result.data ? (
          <div className="mt-5 space-y-5">
            <div
              className={`rounded-[24px] border p-4 text-sm leading-7 ${
                result.saved
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {result.saved
                ? "Hasil ini telah disimpan ke Supabase dalam jadual generation_jobs."
                : "Hasil berjaya dijana, tetapi belum disimpan ke Supabase."}
              {result.saveError ? ` Ralat simpan: ${result.saveError}` : null}
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
              <h3 className="text-3xl font-semibold text-[var(--accent-deep)]">{result.data.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{result.data.tagline}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{result.data.synopsis}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Hook</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{result.data.hook}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Audiens</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{result.data.audience}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Dunia cerita</p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{result.data.worldSummary}</p>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Watak utama</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {result.data.mainCharacters.map((character) => (
                  <div key={character.name} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                    <h4 className="text-lg font-semibold text-[var(--accent-deep)]">{character.name}</h4>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{character.role}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{character.conflict}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Outline 12 bab</p>
              <div className="mt-4 grid gap-4">
                {result.data.chapterOutline.map((chapter) => (
                  <div key={chapter.chapter} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Bab {chapter.chapter}</p>
                    <h4 className="mt-2 text-lg font-semibold text-[var(--accent-deep)]">{chapter.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{chapter.focus}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Cliffhanger: {chapter.cliffhanger}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
