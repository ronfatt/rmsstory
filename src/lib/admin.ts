export type GeneratedNovelBible = {
  title: string;
  tagline: string;
  synopsis: string;
  hook: string;
  audience: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  recommendationCopy: string;
  coverPrompt: string;
  worldSummary: string;
  mainCharacters: Array<{
    name: string;
    role: string;
    conflict: string;
  }>;
  chapterOutline: Array<{
    chapter: number;
    title: string;
    focus: string;
    cliffhanger: string;
  }>;
};

export type GeneratedChapterOutline = {
  chapter: number;
  title: string;
  focus: string;
  cliffhanger: string;
  beats: string[];
};

export type GeneratedChapterDraft = {
  title: string;
  excerpt: string;
  content: string[];
  wordCount: number;
  seoTitle: string;
  seoDescription: string;
  recommendationCopy: string;
};

export type GeneratedChapterRevision = {
  mode: "continue" | "rewrite" | "expand";
  title: string;
  excerpt: string;
  content: string[];
  wordCount: number;
  editorNote: string;
};

export function extractJsonObject(raw: string) {
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? raw;
  const startIndex = candidate.indexOf("{");
  const endIndex = candidate.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Model response did not contain a JSON object.");
  }

  return candidate.slice(startIndex, endIndex + 1);
}

export function isAuthorizedAdminToken(token: string | null) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return false;
  }

  return token === adminToken;
}

export function estimateWordCount(paragraphs: string[]) {
  return paragraphs
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
