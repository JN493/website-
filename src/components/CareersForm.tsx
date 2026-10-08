"use client";
import { useState } from "react";
import Link from "next/link";
import { submitForm } from "@/lib/submitForm";
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
    form.reset();
    setStatus("sent");
  }

  if (status === "sent") {
    return <p role="status">Thanks, we&apos;ve received your CV.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Honeypot />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Name</span>
        <input name="name" type="text" required maxLength={200} autoComplete="name" className="border px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" className="border px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          CV <span className="font-normal text-gray-500">(PDF or Word, max 5 MB)</span>
        </span>
        <input
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={() => setCvError("")}
          aria-invalid={cvError ? true : undefined}
          aria-describedby={cvError ? "cv-error" : undefined}
          className="border px-3 py-2"
        />
        {cvError && <span id="cv-error" role="alert" className="text-sm text-red-700">{cvError}</span>}
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required className="mt-1" />
        <span>
          I agree to SLS Fabrications storing my details and CV to consider me for roles, as set out in the{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </span>
      </label>

      <Turnstile onToken={setToken} resetKey={resetKey} />

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-black text-white px-6 py-3 font-semibold self-start disabled:opacity-50"
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
  );
}
