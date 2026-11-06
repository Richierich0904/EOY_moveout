"use client";

import { useState } from "react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) {
    return (
      <div className="card p-3">
        <div className="flex aspect-[4/5] items-center justify-center rounded-[9px] bg-gradient-to-br from-bg-deep to-bg">
          <span className="display text-[80px] text-muted/40">{title.slice(0, 1)}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      <div className="card p-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[9px] bg-bg">
          {images.map((f, k) => (
            <img key={f} src={`/uploads/${f}`} alt={k === i ? title : ""} aria-hidden={k !== i}
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${k === i ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"}`} />
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-2">
          {images.map((f, k) => (
            <button key={f} type="button" aria-label={`Photo ${k + 1}`} aria-pressed={k === i} onClick={() => setI(k)}
              className={`h-14 w-14 overflow-hidden rounded-[9px] border-2 transition ${k === i ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <img src={`/uploads/${f}`} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
