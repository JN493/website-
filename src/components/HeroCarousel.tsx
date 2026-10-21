"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

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
  },
  {
    alt: "A welder in a helmet welding a stainless steel item",
    widths: [382],
    name: "welding",
    width: 382,
    height: 510,
    position: "50% 40%", // portrait source: keep the helmet visor and torch tip in frame
  },
  {
    alt: "A laser cutting head cutting patterns into sheet metal with a spray of sparks",
    widths: [640, 1280, 1920],
    name: "laser",
    width: 1920,
    height: 1280,
    position: "50% 45%",
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
            </div>
          );
        })}
      </div>

      {/* Dark pill so the controls are visible on any photo; .on-dark gives them a white focus ring.
          Pause/play sits at the left end at the same 10px scale as the dots (WCAG 2.2.2 needs a pause control). */}
      <div className="on-dark absolute bottom-3 right-3 z-20 flex items-center rounded-full bg-black/60 p-1 text-white">
        <button
          type="button"
          aria-label={playing ? "Pause image rotation" : "Play image rotation"}
          onClick={() => setUserPlaying(!playing)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
        >
          <svg aria-hidden="true" viewBox="0 0 10 10" width="10" height="10" fill="currentColor">
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
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
          >
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full border-2 border-white ${i === index ? "bg-white" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
