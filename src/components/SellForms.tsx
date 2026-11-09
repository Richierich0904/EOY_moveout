"use client";

import Link from "next/link";
import { useState } from "react";
import { createListing, createListingsBulk } from "@/actions/listings";
import { CATEGORIES, CONDITIONS, HANDOFF } from "@/lib/config";
import { money } from "@/lib/format";
import { FormError, SubmitButton, useKeptForm } from "./forms";
import { PageIntro } from "./PageIntro";

type Suggestions = Record<string, { median: number; n: number } | null>;
const check = "h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--pop)]";

function HandoffFields({ spots }: { spots: string[] }) {
  return (
    <fieldset className="grid gap-5 border-t border-line pt-6">
      <legend className="eyebrow mb-4">Handoff</legend>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sell-handoff">When</label>
          <select id="sell-handoff" name="handoff" className="input">{HANDOFF.map((h) => <option key={h.slug} value={h.slug}>{h.label}</option>)}</select>
          <p className="mt-1.5 text-[13px] text-muted">Fall means it goes into summer storage and the buyer collects it at move-in.</p>
        </div>
        <div>
          <label className="label" htmlFor="sell-spot">Where to meet</label>
          <select id="sell-spot" name="spot" className="input"><option value="">Pick a spot</option>{spots.map((s) => <option key={s}>{s}</option>)}</select>
          <p className="mt-1.5 text-[13px] text-muted">Always a public place on campus, never a dorm room.</p>
        </div>
      </div>
      <p className="bg-bg-deep p-3.5 text-[13.5px]">Only list things you own and that school allows. No vapes, alcohol, medicine, weapons or anything else on the <Link href="/rules" target="_blank" className="a-link font-semibold">not-allowed list</Link>.</p>
    </fieldset>
  );
}

function SingleForm({ suggestions, spots, maxPhotos }: { suggestions: Suggestions; spots: string[]; maxPhotos: number }) {
  const [state, onSubmit, pending] = useKeptForm(createListing);
  const [free, setFree] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0].slug);
  const tip = suggestions[category];
  return (
    <form onSubmit={onSubmit} className="card grid gap-6 p-5 sm:p-8" encType="multipart/form-data">
      <div>
        <label className="label" htmlFor="sell-photos">Photos <span className="font-normal text-muted">(up to {maxPhotos}, the first is the cover)</span></label>
        <input id="sell-photos" type="file" name="images" accept="image/*" multiple
          className="input cursor-pointer file:mr-3 file:cursor-pointer file:rounded-none file:border-0 file:bg-fg file:px-3.5 file:py-1.5 file:text-[13px] file:font-semibold file:text-bg" />
        <p className="mt-1.5 text-[13px] text-muted">A photo of the item only, with no people in it. A handoff only earns points when the listing has a photo.</p>
      </div>
      <div><label className="label" htmlFor="sell-title">Title</label><input id="sell-title" name="title" required maxLength={80} placeholder="IKEA desk lamp, white" className="input" /></div>
      <div><label className="label" htmlFor="sell-desc">Description</label><textarea id="sell-desc" name="description" rows={3} maxLength={2000} placeholder="Any dents? Does it work? Why are you letting it go?" className="input" /></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sell-cat">Category</label>
          <select id="sell-cat" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="input">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
        </div>
        <div><label className="label" htmlFor="sell-cond">Condition</label><select id="sell-cond" name="condition" defaultValue="Good" className="input">{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sell-price">Price</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input id="sell-price" name="price" type="number" min="0" max="5000" step="0.5" inputMode="decimal" placeholder="0" disabled={free} className="input pl-7 disabled:opacity-50" />
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[14.5px] font-medium"><input type="checkbox" name="free" checked={free} onChange={(e) => setFree(e.target.checked)} className={check} /> Give it away</label>
          </div>
          {free ? <p className="mt-1.5 text-[13px] text-fg">Giving things away earns the most points, and entries in the giveaway draw.</p>
            : tip && <p className="mt-1.5 text-[13px] text-muted">Similar {CATEGORIES.find((c) => c.slug === category)?.label.toLowerCase()} items here sold for about {money(tip.median)} ({tip.n} sales).</p>}
        </div>
        {category === "textbooks" && (
          <div><label className="label" htmlFor="sell-course">Course code</label><input id="sell-course" name="course_code" maxLength={20} placeholder="MATH 301" className="input uppercase" /><p className="mt-1.5 text-[13px] text-muted">Students taking that course find it instantly.</p></div>
        )}
      </div>
      <HandoffFields spots={spots} />
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full sm:w-auto sm:justify-self-start">Post listing</SubmitButton>
    </form>
  );
}

function BulkForm({ spots }: { spots: string[] }) {
  const [state, onSubmit, pending] = useKeptForm(createListingsBulk);
  const rows = Array.from({ length: 10 }, (_, i) => i);
  return (
    <form onSubmit={onSubmit} className="card grid gap-6 p-5 sm:p-8" encType="multipart/form-data">
      <p className="bg-bg-deep p-4 text-[14.5px]">One line per item. An empty price means free, and empty rows are skipped. Add a photo of each item if you can: a handoff only earns points when the listing has one.</p>
      <div className="grid gap-2.5">
        <div className="hidden grid-cols-[2fr_1.2fr_90px_1.3fr] gap-2 px-1 text-[12px] font-semibold uppercase tracking-[.1em] text-muted sm:grid"><span>Item</span><span>Category</span><span>Price</span><span>Photo</span></div>
        {rows.map((i) => (
          <div key={i} className="grid grid-cols-[1fr_90px] gap-2 bg-bg-deep p-2 sm:grid-cols-[2fr_1.2fr_90px_1.3fr] sm:bg-transparent sm:p-0">
            <input name={`title_${i}`} aria-label={`Item ${i + 1} name`} maxLength={80} placeholder={`Item ${i + 1}`} className="input" />
            <input name={`price_${i}`} aria-label={`Item ${i + 1} price`} type="number" min="0" max="5000" step="0.5" placeholder="Free" className="input sm:order-3" />
            <select name={`category_${i}`} aria-label={`Item ${i + 1} category`} className="input col-span-2 sm:order-2 sm:col-span-1">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
            <input type="file" name={`image_${i}`} aria-label={`Item ${i + 1} photo`} accept="image/*" className="input col-span-2 cursor-pointer text-[13px] file:mr-2 file:rounded-none file:border-0 file:bg-fg file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-bg sm:order-4 sm:col-span-1" />
          </div>
        ))}
      </div>
      <HandoffFields spots={spots} />
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full sm:w-auto sm:justify-self-start">Post all items</SubmitButton>
    </form>
  );
}

export function SellForms({ bulk, suggestions, spots, maxPhotos }: { bulk: boolean; suggestions: Suggestions; spots: string[]; maxPhotos: number }) {
  return (
    <div className="grid max-w-2xl gap-10">
      <PageIntro eyebrow={bulk ? "Move-out mode" : "Sell or give away"} title={bulk ? "Clear out your room." : "List something."}
        sub={bulk ? "Ten things in two minutes. Most of it can just be free." : "A photo, a title and a price. Takes under a minute."}>
        <nav aria-label="Listing mode" className="flex gap-1 border border-line p-1">
          <Link aria-current={!bulk ? "page" : undefined} href="/listings/new" className={`px-4 py-1.5 text-[14px] font-medium transition ${!bulk ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>One item</Link>
          <Link aria-current={bulk ? "page" : undefined} href="/listings/new?mode=bulk" className={`px-4 py-1.5 text-[14px] font-medium transition ${bulk ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>Many items</Link>
        </nav>
      </PageIntro>
      {bulk ? <BulkForm spots={spots} /> : <SingleForm suggestions={suggestions} spots={spots} maxPhotos={maxPhotos} />}
    </div>
  );
}
