"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Page-wide motion: the nav slides away on scroll down and returns on scroll up,
 *  and `.reveal` blocks below the fold fade up once as they enter view. */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const nav = document.getElementById("site-nav");
    let last = window.scrollY, ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav?.toggleAttribute("data-hidden", y > last && y > 140);
        last = y; ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.getElementById("site-nav")?.removeAttribute("data-hidden");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    const vh = window.innerHeight;
    const pending = [...document.querySelectorAll<HTMLElement>(".reveal")].filter((el) => el.getBoundingClientRect().top > vh * 0.92);
    pending.forEach((el) => el.classList.add("pre"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
    );
    pending.forEach((el) => io.observe(el));
    const fallback = setTimeout(() => pending.forEach((el) => el.classList.remove("pre")), 4000);
    return () => { io.disconnect(); clearTimeout(fallback); pending.forEach((el) => el.classList.remove("pre")); };
  }, [pathname]);

  return null;
}
