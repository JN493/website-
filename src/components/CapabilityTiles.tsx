"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { ImageBox } from "@/components/TileGrid";
import type { Capability } from "@/lib/capabilities";

// Capabilities tiles: each is a button that opens a native <dialog> (showModal) with that service's copy.
// All 12 dialogs are in the HTML from the start (closed), so search engines can read them.
// Each pop-up has its own link, /capabilities#<slug>:
//   - opening from a tile pushes #slug, so the browser Back button closes it;
//   - loading the page with #slug opens it, and closing then removes the hash without adding history;
//   - an unknown hash is ignored.
// showModal gives Esc to close, keeps focus inside and makes the page behind inert. We add: click outside
// closes, focus returns to the tile, the page behind cannot scroll. No tracking events.

type Ctl = {
  dialogs: Record<string, HTMLDialogElement | null>;
  tiles: Record<string, HTMLButtonElement | null>;
  open: string | null; // slug of the open pop-up
  pushed: boolean; // true when our pushState added the current #slug history entry
};

function lockScroll(on: boolean) {
  const s = document.documentElement.style;
  s.overflow = on ? "hidden" : "";
  s.scrollbarGutter = on ? "stable" : ""; // keeps the scrollbar's space, so the page does not shift
}

const hashSlug = () => decodeURIComponent(window.location.hash.slice(1));
const urlWithoutHash = () => window.location.pathname + window.location.search;

function showDialog(ctl: Ctl, slug: string, push: boolean) {
  const dialog = ctl.dialogs[slug];
  if (!dialog || dialog.open) return;
  const previous = ctl.open;
  ctl.open = slug; // set first, so the previous dialog's close event knows it is no longer current
  if (previous) ctl.dialogs[previous]?.close();
  if (push) window.history.pushState(null, "", `#${slug}`);
  ctl.pushed = push;
  dialog.showModal();
  lockScroll(true);
}

// Close button, Esc and click outside all come here, so the address and history stay in step.
function requestClose(ctl: Ctl) {
  if (!ctl.open) return;
  if (ctl.pushed) {
    ctl.pushed = false;
    window.history.back(); // the popstate handler closes the dialog
    return;
  }
  window.history.replaceState(window.history.state, "", urlWithoutHash());
  ctl.dialogs[ctl.open]?.close();
}

// Runs on load and on Back/Forward: open the pop-up named by the hash, or close the open one.
function syncWithHash(ctl: Ctl) {
  const slug = hashSlug();
  if (slug && ctl.dialogs[slug]) {
    if (ctl.open !== slug) showDialog(ctl, slug, false);
  } else if (ctl.open) {
    ctl.pushed = false;
    ctl.dialogs[ctl.open]?.close();
  }
}

// The dialog's close event, however it was closed.
function handleClosed(ctl: Ctl, slug: string) {
  if (ctl.open !== slug) return; // replaced by another pop-up
  ctl.open = null;
  lockScroll(false);
  // Closed some other way (for example the browser closing it on a repeated Esc): tidy the address too.
  if (hashSlug() === slug) {
    if (ctl.pushed) window.history.back();
    else window.history.replaceState(window.history.state, "", urlWithoutHash());
  }
  ctl.pushed = false;
  ctl.tiles[slug]?.focus();
}

export default function CapabilityTiles({ items }: { items: Capability[] }) {
  const ctl = useRef<Ctl>({ dialogs: {}, tiles: {}, open: null, pushed: false });

  useEffect(() => {
    const state = ctl.current;
    const onPopState = () => syncWithHash(state);
    window.addEventListener("popstate", onPopState);
    syncWithHash(state); // page loaded (or returned to) with #slug
    return () => {
      window.removeEventListener("popstate", onPopState);
      lockScroll(false);
    };
  }, []);

  return (
    <>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Reveal as="li" key={c.slug}>
            <button
              type="button"
              ref={(el) => {
                ctl.current.tiles[c.slug] = el;
              }}
              aria-haspopup="dialog"
              aria-labelledby={`cap-${c.slug}-name`}
              aria-describedby={`cap-${c.slug}-sub`}
              onClick={() => showDialog(ctl.current, c.slug, true)}
              className="tile block h-full w-full cursor-pointer rounded-lg text-left"
            >
              <ImageBox title={c.title} image={c.image} titleAs="span" titleId={`cap-${c.slug}-name`} />
              <span className="tile-desc mt-4 block">
                <span id={`cap-${c.slug}-sub`} className="tile-text block text-muted">{c.subtitle}</span>
              </span>
            </button>
          </Reveal>
        ))}
      </ul>

      {items.map((c) => (
        <dialog
          key={c.slug}
          ref={(el) => {
            ctl.current.dialogs[c.slug] = el;
          }}
          aria-labelledby={`cap-${c.slug}-title`}
          onCancel={(e) => {
            e.preventDefault(); // Esc: close through requestClose so the hash and history stay right
            requestClose(ctl.current);
          }}
          onClose={() => handleClosed(ctl.current, c.slug)}
          onClick={(e) => {
            if (e.target === e.currentTarget) requestClose(ctl.current); // the backdrop (the panel fills the dialog)
          }}
          className="cap-dialog m-auto w-[min(42rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-lg bg-white p-0 text-ink shadow-2xl backdrop:bg-[rgba(20,33,43,0.6)]"
        >
          <div className="flex max-h-[90vh] flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
              <h2 id={`cap-${c.slug}-title`} className="pt-1.5 text-2xl font-bold tracking-tight text-brand">
                {c.title}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => requestClose(ctl.current)}
                className="-mr-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl text-brand hover:bg-tint"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-6 leading-relaxed sm:px-8">
              {c.intro.map((p) => (
                <p key={p} className="mb-4">
                  {p}
                </p>
              ))}
              <p className="mt-6 font-semibold text-brand">Applications include:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-brand">
                {c.applications.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <h3 className="mt-8 text-lg font-semibold text-brand">{c.closing}</h3>
              {c.closingText && <p className="mt-2">{c.closingText}</p>}
              <Link href="/contact" className="btn btn-primary mt-6">
                Contact Us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </dialog>
      ))}
    </>
  );
}
