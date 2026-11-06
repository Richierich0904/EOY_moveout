"use client";

import { useEffect, useRef, useState } from "react";

/** Edge-to-edge snap row with drag-to-scroll and small round prev/next controls. */
export function Shelves({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const sc = ref.current!; let drag: { x: number; left: number; moved: boolean } | null = null;
    const upd = () => setEdges({ start: sc.scrollLeft < 4, end: sc.scrollLeft + sc.clientWidth > sc.scrollWidth - 4 });
    const down = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; drag = { x: e.clientX, left: sc.scrollLeft, moved: false }; };
    const move = (e: PointerEvent) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 5) { drag.moved = true; sc.style.scrollSnapType = "none"; sc.setPointerCapture(e.pointerId); } sc.scrollLeft = drag.left - dx; };
    const up = () => { sc.style.scrollSnapType = ""; setTimeout(() => (drag = null), 0); };
    const click = (e: MouseEvent) => { if (drag?.moved) { e.preventDefault(); e.stopPropagation(); } };
    upd(); sc.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd);
    sc.addEventListener("pointerdown", down); sc.addEventListener("pointermove", move); sc.addEventListener("pointerup", up); sc.addEventListener("pointercancel", up); sc.addEventListener("click", click, true);
    return () => { sc.removeEventListener("scroll", upd); window.removeEventListener("resize", upd); sc.removeEventListener("pointerdown", down); sc.removeEventListener("pointermove", move); sc.removeEventListener("pointerup", up); sc.removeEventListener("pointercancel", up); sc.removeEventListener("click", click, true); };
  }, []);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });
  const btn = "flex h-9 w-9 items-center justify-center rounded-full bg-fg/[.07] text-fg transition hover:bg-fg/[.13] active:scale-95 disabled:opacity-30";
  return (
    <div>
      <div ref={ref} tabIndex={0} aria-label={label} className="scroller-row -mx-[max(16px,env(safe-area-inset-left,0px))] scroll-px-[max(16px,env(safe-area-inset-left,0px))] cursor-grab px-[max(16px,env(safe-area-inset-left,0px))] py-2 active:cursor-grabbing">
        {children}
      </div>
      <div className="mt-2 hidden justify-end gap-1.5 sm:flex">
        <button type="button" aria-label={`Scroll ${label} back`} className={btn} disabled={edges.start} onClick={() => go(-1)}>←</button>
        <button type="button" aria-label={`Scroll ${label} forward`} className={btn} disabled={edges.end} onClick={() => go(1)}>→</button>
      </div>
    </div>
  );
}
