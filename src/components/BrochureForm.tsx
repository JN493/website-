"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Honeypot, looksLikeBot, useShownAt } from "@/components/SpamGuard";

export default function BrochureForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
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

    setStatus("sending");
    // Only saves the request. Emailing the brochure comes later via an email function.
    const { error } = await supabase.from("brochure_requests").insert({
      email: String(data.get("email") ?? "").trim(),
      consent_given_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      setStatus("error");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  if (status === "sent") {
    return <p role="status">Thanks, we&apos;ll send you the brochure shortly.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Honeypot />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" className="border px-3 py-2" />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required className="mt-1" />
        <span>
          I agree to SLS Fabrications using my email address to send me the brochure, as set out in the{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-black text-white px-6 py-3 font-semibold self-start disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Download brochure"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          Something went wrong sending your request. Please try again or call us on 01323 846061.
        </p>
      )}
    </form>
  );
}
