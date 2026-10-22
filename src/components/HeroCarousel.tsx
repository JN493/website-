"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

// TEST IMAGE: replace before launch. All three slides are test images. Team and laser are Unsplash photos (team is NOT SLS staff); welding is SLS's own
// but only 382px wide, so it looks soft on large screens. See CLAUDE.md "Launch blockers" and design-assets/SOURCES.md.
const slides = [
  {
    alt: "Workers in orange high-visibility vests and hard hats walking past an industrial building",
    widths: [640, 1280, 1920],
    name: "team",
    width: 1920,
    height: 1281,
    position: "50% 70%",
    headline: "From Concept to Creation. Thoughtfully Engineered.",
    cta: { label: "Explore Our Services", href: "/capabilities" },
  },
  {
    alt: "A welder in a helmet welding a stainless steel item",
    widths: [382],
    name: "welding",
    width: 382,
    height: 510,
    position: "50% 40%", // portrait source: keep the helmet visor and torch tip in frame
    headline: "Made to Fit. Built to Perform.",
    line: "Bespoke fabrication. Practical solutions. Exceptional results.",
    cta: { label: "Discover What We Do", href: "/capabilities" },
  },
  {
    alt: "A laser cutting head cutting patterns into sheet metal with a spray of sparks",
    widths: [640, 1280, 1920],
    name: "laser",
    width: 1920,
    height: 1280,
    position: "50% 45%",
    headline: "Ready to Make It Happen? Let's talk.",
    cta: { label: "Request a Quote", href: "/contact#quote" }, // opens the quote form
  },
];

const INTERVAL_MS = 6000; // the slide animation (600ms) is in globals.css

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null); // the slide moving out, while it animates
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null); // null until the visitor presses pause/play
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

  // Reduced motion starts paused; the visitor can still press play.
  const playing = userPlaying ?? !reducedMotion;
  const rotating = playing && !hovered && !focusInside;

  function show(next: number) {
    if (next === index) return;
    setPrev(index);
    setIndex(next);
  }

  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => {
      setPrev(index);
      setIndex((index + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [rotating, index]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Photos"
      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-steel sm:aspect-[16/9]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusInside(false);
      }}
    >
      <div aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const current = i === index;
          // Every move is right to left (new slide in from the right), including the wrap from the last to the first.
          const motion = current ? (prev === null ? "" : "hero-in") : i === prev ? "hero-out" : "invisible";
          return (
            <div
              key={slide.name}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              aria-hidden={!current}
              inert={!current} // only the visible slide's text and button can be reached by keyboard or screen reader
              className={`absolute inset-0 ${current ? "z-10" : ""} ${motion}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img with srcset */}
              <img
                src={`/images/hero/${slide.name}-${slide.widths.at(-1)}.webp`}
                srcSet={slide.widths.map((w) => `/images/hero/${slide.name}-${w}.webp ${w}w`).join(", ")}
                sizes="(min-width: 1152px) 1088px, calc(100vw - 2rem)"
                width={slide.width}
                height={slide.height}
                alt={slide.alt}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="h-full w-full object-cover"
                style={{ objectPosition: slide.position }}
              />
              {/* Dark gradient so the white text passes 4.5:1 over every photo (strongest at the top, where the text is). */}
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.6)_45%,rgba(0,0,0,0.25)_80%,rgba(0,0,0,0.1)_100%)]" />
              {/* Text top left, clear of the controls pill (bottom right). h2: the page's h1 is "SLS Fabrications". */}
              {/* Below 360px wide everything is a little tighter so slide 2 stays clear of the controls. */}
              <div className="on-dark absolute inset-x-0 top-0 max-w-2xl p-5 max-[359px]:p-4 sm:p-8 lg:p-12">
                <h2 className="text-xl font-bold leading-tight tracking-tight text-white max-[359px]:text-lg sm:text-3xl lg:text-4xl">{slide.headline}</h2>
                {slide.line && <p className="mt-2 text-sm text-white max-[359px]:mt-1 max-[359px]:text-[0.8125rem] max-[359px]:leading-snug sm:mt-3 sm:text-lg">{slide.line}</p>}
                <Link
                  href={slide.cta.href}
                  className="mt-4 max-[359px]:mt-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand shadow-md transition-[transform,background-color] hover:bg-tint-2 focus-visible:bg-tint-2 motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-y-0.5 sm:mt-6"
                >
                  {slide.cta.label} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dark pill so the controls are visible on any photo; .on-dark gives them a white focus ring.
          Pause/play sits at the left end at the same scale as the dots (WCAG 2.2.2 needs a pause control).
          Drawn at 70% (31px slots, 7px dots, 3px padding: 130x37). Tap areas: each dot is its whole 31x31 slot
          (WCAG 2.2 minimum is 24x24); pause/play stays 44x44 through -6.5px margins (it takes a 31x31 slot in the
          layout) and sits on top, so the first dot still has 24.5px; its focus ring is pulled in to the drawn slot. */}
      <div className="on-dark absolute bottom-3 right-3 z-20 flex items-center rounded-full bg-black/60 p-[3px] text-white">
        <button
          type="button"
          aria-label={playing ? "Pause image rotation" : "Play image rotation"}
          onClick={() => setUserPlaying(!playing)}
          className="relative z-10 -m-[6.5px] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-offset-[-4.5px]"
        >
          <svg aria-hidden="true" viewBox="0 0 10 10" width="7" height="7" fill="currentColor">
            {playing ? <path d="M1.5 0h2.5v10H1.5zM6 0h2.5v10H6z" /> : <path d="M1.5 0l8 5-8 5z" />}
          </svg>
        </button>
        {slides.map((slide, i) => (
          <button
            key={slide.name}
            type="button"
            aria-label={`Show image ${i + 1} of ${slides.length}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => show(i)}
            className="flex h-[31px] w-[31px] cursor-pointer items-center justify-center rounded-full"
          >
            <span aria-hidden="true" className={`h-[7px] w-[7px] rounded-full border-[1.5px] border-white ${i === index ? "bg-white" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
