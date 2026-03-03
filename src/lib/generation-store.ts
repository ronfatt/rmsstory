import type { SupabaseClient } from "@supabase/supabase-js";

export async function saveGenerationJob(
  supabase: SupabaseClient | null,
  jobType: string,
  inputPayload: Record<string, unknown>,
  outputPayload: unknown,
) {
  if (!supabase) {
    return { saved: false, saveError: undefined as string | undefined };
  }

  const { error } = await supabase.from("generation_jobs").insert({
    job_type: jobType,
    input_payload: inputPayload,
    output_payload: outputPayload,
    status: "completed",
  });

  return {
    saved: !error,
    saveError: error?.message,
  };
}
