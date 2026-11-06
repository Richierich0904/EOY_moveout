"use client";

import { useState } from "react";

/** Big photo with a strip of thumbnails underneath. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) {
    return <div className="card flex aspect-[4/5] items-center justify-center"><span className="display text-[80px] uppercase text-line">{title.slice(0, 1)}</span></div>;
  }
  return (
    <div className="grid gap-3">
      <div className="card relative aspect-[4/5] overflow-hidden">
        {images.map((f, k) => (
          <img key={f} src={`/uploads/${f}`} alt={k === i ? title : ""} aria-hidden={k !== i}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${k === i ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"}`} />
        ))}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((f, k) => (
            <button key={f} type="button" aria-label={`Photo ${k + 1}`} aria-pressed={k === i} onClick={() => setI(k)} onMouseEnter={() => setI(k)}
              className={`card aspect-square overflow-hidden transition ${k === i ? "border-fg" : "opacity-70 hover:opacity-100"}`}>
              <img src={`/uploads/${f}`} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
