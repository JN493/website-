"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Honeypot, looksLikeBot, useShownAt } from "@/components/SpamGuard";

export default function Contact() {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Projects page links here as /contact#quote to open the form directly.
  // The hash only exists in the browser, so it has to be read after the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.hash === "#quote") setShowQuoteForm(true);
  }, []);

  const formShownAt = useShownAt(showQuoteForm);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? "").trim();

    if (looksLikeBot(data, formShownAt.current)) {
      form.reset();
      setConsent(false);
      setStatus("sent");
      return;
    }

    setStatus("sending");

    // ponytail: files upload before the row is saved, so a failed save leaves orphan files in the bucket
    const folder = crypto.randomUUID();
    const filePaths: string[] = [];
    for (const file of data.getAll("files") as File[]) {
      if (!file.size) continue;
      const path = `${folder}/${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("quote-files").upload(path, file);
      if (error) {
        console.error(error);
        setStatus("error");
        return;
      }
      filePaths.push(path);
    }

    const { error } = await supabase.from("quote_requests").insert({
      name: text("name"),
      company: text("company"),
      phone: text("phone"),
      email: text("email"),
      project_details: text("project_details"),
      submission_description: text("submission_description"),
      file_paths: filePaths,
      consent_given_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      setStatus("error");
      return;
    }

    form.reset();
    setConsent(false);
    setStatus("sent");
  }

  return (
    <main className={`p-6 mx-auto w-full ${showQuoteForm ? "max-w-2xl" : "max-w-6xl"}`}>
      <h1 className="text-3xl font-bold mb-6">{showQuoteForm ? "Request a Quote" : "Contact"}</h1>

      {!showQuoteForm && (
        <>
          <p className="text-gray-600 mb-8">
            Have a project ready to quote, need help finding the right solution, or want to join us? Choose the option that fits.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <section className="border p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-2">Request a Quote</h2>
              <p className="text-gray-600 text-sm">
                Ready to partner on your next project? Have drawings or a specification in mind? Send us the details so our team can discuss your requirements and prepare a quote.
              </p>
              <div className="mt-auto pt-6">
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="bg-black text-white px-6 py-3 font-semibold"
                >
                  Request a Quote
                </button>
              </div>
            </section>

            <section className="border p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-2">Talk to the Team</h2>
              <p className="text-gray-600 text-sm">Not sure what you want, but looking for a solution? Talk to our team.</p>
              <div className="mt-auto pt-6">
                <a
                  href="mailto:info@slsfabrications.com"
                  className="border px-6 py-3 font-semibold inline-block"
                >
                  Talk to our team
                </a>
                <p className="text-gray-600 text-sm mt-4">
                  Prefer to talk on the phone? Call us on <a href="tel:01323846061" className="underline">01323 846061</a>
                </p>
              </div>
            </section>

            <section className="border p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-2">Join Our Team</h2>
              <div className="mt-auto pt-6">
                <Link href="/careers" className="border px-6 py-3 font-semibold inline-block">
                  Join Our Team
                </Link>
              </div>
            </section>
          </div>
        </>
      )}

      {showQuoteForm && status === "sent" && (
        <p role="status">
          Thanks, we&apos;ve received your request and will be in touch soon to discuss the details further and arrange a meeting if needed.
        </p>
      )}

      {showQuoteForm && status !== "sent" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowQuoteForm(false)}
            className="text-sm text-gray-500 text-left"
          >
            ← Back
          </button>

          <Honeypot />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name</span>
            <input name="name" type="text" required maxLength={200} className="border px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Company (optional)</span>
            <input name="company" type="text" maxLength={200} className="border px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Phone</span>
            <input name="phone" type="tel" required maxLength={50} className="border px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input name="email" type="email" required maxLength={200} className="border px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Project details</span>
            <textarea name="project_details" rows={4} maxLength={5000} className="border px-3 py-2"></textarea>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Describe what you&apos;re submitting</span>
            <textarea
              name="submission_description"
              rows={2}
              maxLength={1000}
              placeholder="e.g. 3 drawings for a steel bracket, revision 2"
              className="border px-3 py-2"
            ></textarea>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Upload drawings / files</span>
            <input name="files" type="file" multiple className="border px-3 py-2" />
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>I agree to be contacted about this enquiry and understand my details will be handled in line with the Privacy Policy.</span>
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-black text-white px-6 py-3 font-semibold disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Submit"}
          </button>
          {status === "error" && (
            <p role="alert" className="text-sm text-red-700">
              Something went wrong sending your request. Please try again or call us on 01323 846061.
            </p>
          )}
        </form>
      )}
    </main>
  );
}
