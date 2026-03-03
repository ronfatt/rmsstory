import { extractJsonObject, type GeneratedCoverConcept, type GeneratedNovelBible } from "@/lib/admin";
import type OpenAI from "openai";

export async function generateCoverConcept({
  client,
  bible,
  genre,
  coverDirection,
}: {
  client: OpenAI;
  bible: GeneratedNovelBible;
  genre: string;
  coverDirection: string;
}) {
  const prompt = `
Anda art director untuk platform novel bersiri Bahasa Melayu.

Tugas anda ialah menghasilkan konsep sampul novel yang sangat menarik untuk klik.

Keperluan:
- Gaya visual mesti terasa premium, komersial, dramatik, dan jelas genre-nya.
- Jangan hasilkan prompt yang terlalu generik.
- Elakkan rujukan kepada karya, francais, atau artis tertentu.
- Pastikan prompt sesuai digunakan pada model imej moden.
- Cerita ini perlu terasa seperti web novel panjang yang ketagihan.
- Arah visual tambahan: ${coverDirection}
- Genre utama: ${genre}

Data novel:
${JSON.stringify(bible, null, 2)}

Pulangkan JSON sahaja:
{
  "prompt": "string",
  "altPrompt": "string",
  "visualHook": "string",
  "titleTreatment": "string",
  "palette": ["string", "string", "string"]
}
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const raw = response.output_text?.trim();

  if (!raw) {
    throw new Error("Model returned an empty response.");
  }

  return JSON.parse(extractJsonObject(raw)) as GeneratedCoverConcept;
}
