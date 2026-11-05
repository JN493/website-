"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitForm } from "@/lib/submitForm";
import { track } from "@/lib/track";
import { Honeypot, looksLikeBot, useShownAt } from "@/components/SpamGuard";
import Turnstile, { TURNSTILE_WAIT_MESSAGE } from "@/components/Turnstile";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

// Invisible copy of the phone line under the Request a Quote and Careers at SLS buttons,
// so all three buttons line up when the cards sit side by side (lg). Hidden entirely when the cards stack.
const phoneSpacer = (
  <p aria-hidden="true" className="invisible hidden lg:block text-sm mt-4">
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
          location: text("location"),
          phone: text("phone"),
          email: text("email"),
          need_by: text("need_by"),
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
      <PageHeader title={showQuoteForm ? "Request a Quote" : "Good Ideas Deserve Great Execution."}>
        {!showQuoteForm && (
          <>
            <p>
              From precision components to bespoke installations, SLS Fabrications brings skilled workmanship, technical expertise and practical thinking to every project.
            </p>
            <p className="mt-3">Whether you&apos;re working from a detailed specification or developing a new idea, let&apos;s get started.</p>
          </>
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
          <div className="grid gap-6 lg:grid-cols-3">
            <Reveal as="section" className="card flex flex-col">
              <h2 className="text-xl font-semibold text-brand mb-2">Request a Quote</h2>
              <p className="text-muted">
                Know what you need? Send us your drawings, specifications or project details, and our team will review your requirements and prepare a quotation.
              </p>
              <div className="mt-auto pt-6">
                <button
                  ref={requestButtonRef}
                  onClick={() => {
                    focusAfterToggle.current = "name";
                    setShowQuoteForm(true);
                  }}
                  // 48px like the two outlined buttons beside it, whose 2px border makes them taller than .btn's 44px.
                  className="btn btn-primary min-h-12"
                >
                  Request a Quote
                </button>
                {phoneSpacer}
              </div>
            </Reveal>

            <Reveal as="section" className="card flex flex-col">
              <h2 className="text-xl font-semibold text-brand mb-2">Make an Enquiry</h2>
              <p className="text-muted">Have a concept you&apos;d like to develop or a challenge to solve? Our team is here to help.</p>
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
            </Reveal>

            <Reveal as="section" className="card flex flex-col">
              <h2 className="text-xl font-semibold text-brand mb-2">Careers at SLS</h2>
              <p className="text-muted">We&apos;re proud of the people behind our work and always on the lookout for exceptional talent. If you bring fresh thinking, serious skills and the drive to challenge the ordinary, we&apos;d like to hear from you.</p>
              <div className="mt-auto pt-6">
                <Link href="/careers" className="btn btn-secondary">
                  Careers at SLS
                </Link>
                {phoneSpacer}
              </div>
            </Reveal>
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
            <span className="field-label">Company</span>
            <input name="company" type="text" maxLength={200} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Location (town or area)</span>
            <input name="location" type="text" maxLength={100} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Phone</span>
            <input name="phone" type="tel" required maxLength={50} className="field" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Email</span>
            <input name="email" type="email" required maxLength={200} className="field" />
          </label>

          <div className="flex flex-col gap-1">
            <label htmlFor="quote-need-by" className="field-label">Need by</label>
            <input id="quote-need-by" name="need_by" type="text" maxLength={100} className="field" />
          </div>

          <label className="flex flex-col gap-1">
            <span className="field-label">Project details</span>
            <textarea name="project_details" rows={4} maxLength={5000} className="field"></textarea>
          </label>

          <label className="flex flex-col gap-1">
            <span className="field-label">Describe what you&apos;re submitting</span>
            <textarea
              name="submission_description"
              rows={2}
              maxLength={1000}
              placeholder="e.g. 3 drawings for a steel bracket, revision 2"
              className="field placeholder:text-muted"
            ></textarea>
          </label>

          <div className="flex flex-col gap-1">
            <label htmlFor="quote-files" className="field-label">Upload drawings / files</label>
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
