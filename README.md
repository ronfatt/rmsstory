# CerekaAI

Platform novel bersiri harian dalam Bahasa Melayu, dibina dengan Next.js, Supabase, dan aliran kerja AI untuk menghasilkan novel secara berjadual.

## Stack

- Next.js 16 App Router
- Supabase untuk data novel, bab, dan jadual siaran
- Vercel untuk deployment
- OpenAI API untuk generator bible novel minimum

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

## Supabase setup

Run these files in Supabase SQL Editor, in order:

1. [supabase/schema.sql](/Users/rms/Desktop/Ai%20Project/Ai%20NewsFlow/supabase/schema.sql)
2. [supabase/seed.sql](/Users/rms/Desktop/Ai%20Project/Ai%20NewsFlow/supabase/seed.sql)

Once both scripts succeed, the app will read published books and chapters from Supabase. If the tables are empty or the env vars are missing, the app falls back to local seed content.

## Vercel deployment

1. Import [rmsstory](https://github.com/ronfatt/rmsstory.git) into Vercel.
2. Set these environment variables in Vercel:
   `NEXT_PUBLIC_SUPABASE_URL`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   `OPENAI_API_KEY`
   `ADMIN_TOKEN`
3. Deploy with the default Next.js settings.

Useful routes after deploy:

- `/` home page
- `/novels/[slug]` novel detail
- `/novels/[slug]/chapters/[chapterNumber]` reading page
- `/admin` AI novel bible generator

## Minimal AI generator

The generator lives at `/admin` and calls `POST /api/admin/generate-novel-bible`.

It requires:

- `OPENAI_API_KEY`
- `ADMIN_TOKEN`

The generated output includes:

- Title
- Tagline
- Synopsis
- Hook
- Audience
- Tags
- World summary
- Main characters
- 12 chapter outline

## Verification

```bash
npm run lint
npm run build
```
