"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitForm } from "@/lib/submitForm";
import { track } from "@/lib/track";
import { Honeypot, looksLikeBot, useShownAt } from "@/components/SpamGuard";
import Turnstile, { TURNSTILE_WAIT_MESSAGE } from "@/components/Turnstile";
import PageHeader from "@/components/PageHeader";

// Invisible copy of the phone line under the Request a Quote and Join Our Team buttons,
// so all three buttons line up at desktop width. Hidden entirely on phones, where cards stack.
const phoneSpacer = (
  <p aria-hidden="true" className="invisible hidden md:block text-sm mt-4">
    Prefer to talk on the phone? Call us on 01323 846061
  </p>
);

// Same limits as the submit-form Edge Function (quote: up to 10 files, 20 MB each). The function still checks them.
const MAX_QUOTE_FILES = 10;
const MAX_QUOTE_FILE_BYTES = 20 * 1024 * 1024;

function checkQuoteFiles(files: File[]) {
  return {
    tooMany: files.length > MAX_QUOTE_FILES,
    tooBig: files.some((file) => file.size > MAX_QUOTE_FILE_BYTES),
  };
}

export default function Contact() {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "needs-check">("idle");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [fileProblems, setFileProblems] = useState({ tooMany: false, tooBig: false });

  // Keyboard focus: opening the form or pressing Back removes the element that had focus,
  // so move it on purpose. Set by the button handlers, applied once the new content is rendered.
  const focusAfterToggle = useRef<"name" | "request" | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const requestButtonRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (focusAfterToggle.current === "name") nameRef.current?.focus();
    if (focusAfterToggle.current === "request") requestButtonRef.current?.focus();
    focusAfterToggle.current = null;
  }, [showQuoteForm]);

  // The form is replaced by the thanks message, so focus moves to the message.
  useEffect(() => {
    if (status === "sent") statusRef.current?.focus();
  }, [status]);

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

    const files = (data.getAll("files") as File[]).filter((file) => file.size > 0);
    const problems = checkQuoteFiles(files);
    setFileProblems(problems);
    if (problems.tooMany || problems.tooBig) return;

    if (!token) {
      setStatus("needs-check");
      return;
    }
    setStatus("sending");

    try {
      await submitForm(
        "quote",
        {
          name: text("name"),
          company: text("company"),
          phone: text("phone"),
          email: text("email"),
          project_details: text("project_details"),
          submission_description: text("submission_description"),
          consent,
        },
        files,
        token,
        text("website"),
      );
    } catch (err) {
      console.error(err);
      setStatus("error");
      setResetKey((k) => k + 1);
      return;
    }

    track("quote_request_submitted"); // only after the row is saved and files have uploaded
    form.reset();
    setConsent(false);
    setStatus("sent");
  }

  return (
    <main id="main">
      <PageHeader title={showQuoteForm ? "Request a Quote" : "Contact"}>
        {!showQuoteForm && (
          <p>
            Have a project ready to quote, need help finding the right solution, or want to join us? Choose the option that fits.
          </p>
        )}
      </PageHeader>

      <div className="container-page py-12 sm:py-16">
      {/* Always on the page (empty until success) so screen readers announce the thanks message. */}
      <p ref={statusRef} role="status" aria-live="polite" tabIndex={-1} className="max-w-2xl rounded-lg border border-line bg-tint p-4 font-medium text-ink empty:border-0 empty:p-0">
        {showQuoteForm && status === "sent"
          ? "Thanks, we've received your request and will be in touch soon to discuss the details further and arrange a meeting if needed."
          : ""}
      </p>

      {!showQuoteForm && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <section className="card flex flex-col">
              <h2 className="text-xl font-semibold text-brand mb-2">Request a Quote</h2>
              <p className="text-muted">
                Ready to partner on your next project? Have drawings or a specification in mind? Send us the details so our team can discuss your requirements and prepare a quote.
              </p>
              <div className="mt-auto pt-6">
                <button
                  ref={requestButtonRef}
                  onClick={() => {
                    focusAfterToggle.current = "name";
                    setShowQuoteForm(true);
                  }}
                  className="btn btn-primary"
                >
                  Request a Quote
                </button>
                {phoneSpacer}
              </div>
            </section>

            <section className="card flex flex-col">
              <h2 className="text-xl font-semibold text-brand mb-2">Talk to the Team</h2>
              <p className="text-muted">Not sure what you want, but looking for a solution? Talk to our team.</p>
              <div className="mt-auto pt-6">
                <a
                  href="mailto:info@slsfabrications.com"
                  className="btn btn-secondary"
                >
                  Talk to our team
                </a>
                <p className="text-muted text-sm mt-4">
                  Prefer to talk on the phone? Call us on <a href="tel:01323846061" className="text-brand underline underline-offset-2">01323 846061</a>
                </p>
              </div>
            </section>

            <section className="card flex flex-col">
              <h2 className="text-xl font-semibold text-brand mb-2">Join Our Team</h2>
              <p className="text-muted">No current vacancies, but we&apos;d like to hear from you. Send us your CV.</p>
              <div className="mt-auto pt-6">
                <Link href="/careers" className="btn btn-secondary">
                  Join Our Team
                </Link>
                {phoneSpacer}
              </div>
            </section>
          </div>
        </>
      )}

      {showQuoteForm && status !== "sent" && (
        <form onSubmit={handleSubmit} className="card flex max-w-2xl flex-col gap-5">
          <button
            type="button"
            onClick={() => {
              focusAfterToggle.current = "request";
              setShowQuoteForm(false);
              setFileProblems({ tooMany: false, tooBig: false }); // the file input is emptied when the form closes
            }}
            className="-my-2 cursor-pointer self-start py-2 text-sm font-medium text-brand hover:underline"
          >
            ← Back
          </button>

          <Honeypot />

          <label className="flex flex-col gap-1">
            <span className="field-label">Name</span>
            <input ref={nameRef} name="name" type="text" required maxLength={200} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Company (optional)</span>
            <input name="company" type="text" maxLength={200} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Phone</span>
            <input name="phone" type="tel" required maxLength={50} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Email</span>
            <input name="email" type="email" required maxLength={200} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Project details (optional)</span>
            <textarea name="project_details" rows={4} maxLength={5000} className="field"></textarea>
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Describe what you&apos;re submitting (optional)</span>
            <textarea
              name="submission_description"
              rows={2}
              maxLength={1000}
              placeholder="e.g. 3 drawings for a steel bracket, revision 2"
              className="field placeholder:text-muted"
            ></textarea>
          </label>

          <div className="flex flex-col gap-1">
            <label htmlFor="quote-files" className="field-label">Upload drawings / files (optional)</label>
            <input
              id="quote-files"
              name="files"
              type="file"
              multiple
              onChange={(e) => setFileProblems(checkQuoteFiles(Array.from(e.currentTarget.files ?? [])))}
              aria-invalid={fileProblems.tooMany || fileProblems.tooBig ? true : undefined}
              aria-describedby={["files-hint", fileProblems.tooMany && "files-too-many", fileProblems.tooBig && "files-too-big"].filter(Boolean).join(" ")}
              className="field"
            />
            <span id="files-hint" className="text-sm text-muted">You can attach up to 10 files, 20 MB each.</span>
            {fileProblems.tooMany && (
              <span id="files-too-many" role="alert" className="text-sm text-red-700">Please attach no more than 10 files.</span>
            )}
            {fileProblems.tooBig && (
              <span id="files-too-big" role="alert" className="text-sm text-red-700">One or more files are over 20 MB. Please choose smaller files.</span>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
            />
            <span>I agree to be contacted about this enquiry and understand my details will be handled in line with the Privacy Policy.</span>
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
              Something went wrong sending your request. Please try again or call us on 01323 846061.
            </p>
          )}
        </form>
      )}
      </div>
    </main>
  );
}
