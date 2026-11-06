"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

/** Edge-to-edge snap row with drag-to-scroll and square prev/next arrows centred underneath. */
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
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.75, behavior: "smooth" });
  const btn = "flex h-8 w-8 items-center justify-center border border-line bg-card text-fg transition hover:border-fg disabled:opacity-35 disabled:hover:border-line";
  return (
    <div className="grid gap-5">
      <div ref={ref} tabIndex={0} aria-label={label} className="scroller-row cursor-grab gap-4 active:cursor-grabbing">{children}</div>
      <div className="flex justify-center gap-2">
        <button type="button" aria-label={`Scroll ${label} back`} className={btn} disabled={edges.start} onClick={() => go(-1)}><Icon name="left" size={15} /></button>
        <button type="button" aria-label={`Scroll ${label} forward`} className={btn} disabled={edges.end} onClick={() => go(1)}><Icon name="right" size={15} /></button>
      </div>
    </div>
  );
}
