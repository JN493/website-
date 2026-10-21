"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitForm } from "@/lib/submitForm";
import { track } from "@/lib/track";
import { Honeypot, looksLikeBot, useShownAt } from "@/components/SpamGuard";
import Turnstile, { TURNSTILE_WAIT_MESSAGE } from "@/components/Turnstile";

// Same rules as the submit-form Edge Function, checked here first for friendly messages.
// The function picks the content type from the extension, since browsers often report Word files as blank.
const cvExtensions = ["pdf", "doc", "docx"];
const maxCvBytes = 5 * 1024 * 1024;

export default function CareersForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "needs-check">("idle");
  const [cvError, setCvError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const shownAt = useShownAt();
  const statusRef = useRef<HTMLParagraphElement>(null);

  // The form is replaced by the thanks message, so focus moves to the message.
  useEffect(() => {
    if (status === "sent") statusRef.current?.focus();
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (looksLikeBot(data, shownAt.current)) {
      form.reset();
      setStatus("sent");
      return;
    }

    const cv = data.get("cv") as File;
    const ext = cv.name.split(".").pop()?.toLowerCase() ?? "";
    if (!cvExtensions.includes(ext)) {
      setCvError("Please upload your CV as a PDF or Word document (.pdf, .doc or .docx).");
      return;
    }
    if (cv.size > maxCvBytes) {
      setCvError("Your CV must be 5 MB or smaller.");
      return;
    }
    setCvError("");
    if (!token) {
      setStatus("needs-check");
      return;
    }
    setStatus("sending");

    try {
      await submitForm(
        "careers",
        { name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), consent: true },
        [cv],
        token,
        String(data.get("website") ?? ""),
      );
    } catch (err) {
      console.error(err);
      setStatus("error");
      setResetKey((k) => k + 1);
      return;
    }
    track("cv_submitted"); // only after the row is saved and the CV has uploaded
    form.reset();
    setStatus("sent");
  }

  return (
    <>
      {/* Always on the page (empty until success) so screen readers announce the thanks message. */}
      <p ref={statusRef} role="status" aria-live="polite" tabIndex={-1} className="rounded-lg border border-line bg-tint p-4 font-medium text-ink empty:border-0 empty:p-0">
        {status === "sent" ? "Thanks, we've received your CV." : ""}
      </p>
      {status !== "sent" && (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Honeypot />

      <label className="flex flex-col gap-1">
        <span className="field-label">Name</span>
        <input name="name" type="text" required maxLength={200} autoComplete="name" className="field" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">Email</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" className="field" />
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="cv-file" className="field-label">
          CV <span className="font-normal text-muted">(PDF or Word, max 5 MB)</span>
        </label>
        <input
          id="cv-file"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={() => setCvError("")}
          aria-invalid={cvError ? true : undefined}
          aria-describedby={cvError ? "cv-error" : undefined}
          className="field"
        />
        {cvError && <span id="cv-error" role="alert" className="text-sm text-red-700">{cvError}</span>}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
        <span>
          I agree to SLS Fabrications storing my details and CV to consider me for roles, as set out in the{" "}
          <Link href="/privacy" className="text-brand underline underline-offset-2">Privacy Policy</Link>.
        </span>
      </label>

      <Turnstile onToken={setToken} resetKey={resetKey} />

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary self-start"
      >
        {status === "sending" ? "Sending..." : "Submit"}
      </button>
      {status === "needs-check" && !token && <p role="alert" className="text-sm text-red-700">{TURNSTILE_WAIT_MESSAGE}</p>}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          Something went wrong sending your CV. Please try again or call us on 01323 846061.
        </p>
      )}
    </form>
      )}
    </>
  );
}
