"use client";

import { useState } from "react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className="flex aspect-square items-center justify-center rounded-md bg-[#f7f7f7] text-7xl text-line">📦</div>;
  return (
    <div className="flex gap-2">
      {images.length > 1 && (
        <div className="flex w-12 shrink-0 flex-col gap-2">
          {images.map((f, k) => (
            <button key={f} onMouseEnter={() => setI(k)} onClick={() => setI(k)} className={`aspect-square overflow-hidden rounded-md border-2 ${k === i ? "border-accent" : "border-line"}`}>
              <img src={`/uploads/${f}`} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-center justify-center rounded-md bg-[#f7f7f7]">
        <img src={`/uploads/${images[i]}`} alt={title} className="max-h-[520px] w-full object-contain" />
      </div>
    </div>
  );
}
