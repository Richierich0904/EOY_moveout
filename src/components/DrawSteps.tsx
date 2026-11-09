"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { t: "Give it away", body: "List something for free and hand it to whoever asks first. Anything counts: a lamp, a rug, last year's textbook.", note: "Add a photo of the item. A giveaway only counts when the listing has one." },
  { t: "They confirm", body: "The person who got it taps “Yes, I received it” on the listing. That is what turns a giveaway into a real one.", note: "Pick who got it when you mark the listing as gone, so they can confirm." },
  { t: "You get an entry", body: "Confirmed giveaways add up. Reach the target and you have an entry in the current draw.", note: "It never costs anything to take part. Winners are picked automatically at the end date." },
];

/** Segmented three-step explainer that plays itself while in view and pauses on hover or focus. */
export function DrawSteps({ perTicket }: { perTicket: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((x) => (x + 1) % STEPS.length), 6000);
    return () => clearTimeout(t);
  }, [i, paused, inView]);
  const s = STEPS[i];
  return (
    <div ref={ref} className="grid gap-6" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div role="group" aria-label="How the draw works" className="flex max-w-full gap-1 overflow-x-auto border border-line p-1 [scrollbar-width:none]">
        {STEPS.map((x, k) => (
          <button key={x.t} type="button" aria-pressed={k === i} onClick={() => setI(k)}
            className={`relative overflow-hidden whitespace-nowrap px-4 py-2 text-[14px] font-medium transition-[background-color,box-shadow] duration-300 ${k === i ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>
            {k + 1}. {x.t}
            {k === i && !paused && inView && <span key={i} aria-hidden className="absolute bottom-0 left-0 h-[2px] w-full origin-left animate-[grow_6s_linear_forwards] bg-accent" />}
          </button>
        ))}
      </div>
      <div className="card grid items-center gap-6 overflow-hidden p-6 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:p-8">
        <div className="flex aspect-[5/4] items-center justify-center rounded-none bg-bg">
          <span key={i} className="display animate-[rise_.7s_cubic-bezier(.16,1,.3,1)_both] text-[clamp(4rem,10vw,7rem)] leading-none text-accent">
            {i === 0 ? "Free" : i === 1 ? "✓" : `1/${perTicket}`.replace("1/", `${perTicket}→1`)}
          </span>
        </div>
        <div key={`t${i}`} className="grid animate-[rise_.5s_cubic-bezier(.16,1,.3,1)_both] gap-3">
          <p className="eyebrow">Step {i + 1} of 3</p>
          <h3 className="text-[28px]">{s.t}</h3>
          <p className="text-[16.5px] leading-relaxed">{i === 2 ? `Every ${perTicket} confirmed giveaways add up to one entry in the current draw.` : s.body}</p>
          <p className="border-l-[3px] border-fg pl-3.5 text-[14.5px] text-muted">{s.note}</p>
        </div>
      </div>
    </div>
  );
}
