import { supabase } from "@/lib/supabase";
import { getSource } from "@/lib/source";

// Sends a form to the submit-form Edge Function, which checks the Turnstile token,
// validates everything and saves the row. Files then upload straight to storage
// using the one-time signed upload URLs the function returns.
// Quote and brochure requests also carry where the visitor came from; careers never does.
// Throws on any failure, so callers show their normal error message.

export type FormType = "quote" | "brochure" | "careers";

type Upload = { bucket: string; path: string; token: string; contentType: string };

export async function submitForm(
  form: FormType,
  fields: Record<string, string | boolean>,
  files: File[],
  turnstileToken: string,
  honeypot: string,
) {
  const { data, error } = await supabase.functions.invoke<{ uploads: Upload[] }>("submit-form", {
    body: {
      form,
      fields,
      turnstileToken,
      website: honeypot,
      files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      ...(form !== "careers" && { source: { ...getSource(), submitted_from: location.pathname } }),
    },
  });
  if (error || !data) throw error ?? new Error("No response from submit-form");

  // Uploads come back in the same order as the files were sent.
  for (let i = 0; i < data.uploads.length; i++) {
    const u = data.uploads[i];
    const { error: uploadError } = await supabase.storage
      .from(u.bucket)
      .uploadToSignedUrl(u.path, u.token, files[i], { contentType: u.contentType });
    if (uploadError) throw uploadError;
  }
}
