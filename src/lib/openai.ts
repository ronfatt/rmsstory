import OpenAI from "openai";

let client: OpenAI | null | undefined;

export function getOpenAIClient() {
  if (client !== undefined) {
    return client;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    client = null;
    return client;
  }

  client = new OpenAI({ apiKey });
  return client;
}

export function hasOpenAIEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}
