"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createListing, createListingsBulk } from "@/actions/listings";
import { CATEGORIES, CONDITIONS, HANDOFF, HANDOFF_SPOTS } from "@/lib/config";
import { money } from "@/lib/format";
import { FormError, SubmitButton } from "./forms";
import { PageIntro } from "./PageIntro";

type Suggestions = Record<string, { median: number; n: number } | null>;
const check = "h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--terracotta)]";

function HandoffFields() {
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
          <select id="sell-spot" name="spot" className="input"><option value="">Pick a spot</option>{HANDOFF_SPOTS.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-[10px] bg-moss/10 p-3.5 text-[14.5px]">
        <input type="checkbox" name="accepts_credits" className={`${check} mt-0.5`} />
        <span><b className="font-semibold">Accept ⭐ credits as payment.</b> <span className="text-muted">One credit is $1 of price. People win them in the giveaway draw.</span></span>
      </label>
    </fieldset>
  );
}

function SingleForm({ suggestions }: { suggestions: Suggestions }) {
  const [state, action] = useActionState(createListing, undefined);
  const [free, setFree] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0].slug);
  const tip = suggestions[category];
  return (
    <form action={action} className="card grid gap-6 p-5 sm:p-8" encType="multipart/form-data">
      <div>
        <label className="label" htmlFor="sell-photos">Photos <span className="font-normal text-muted">(up to 6, the first is the cover)</span></label>
        <input id="sell-photos" type="file" name="images" accept="image/*" multiple
          className="input cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent/15 file:px-3.5 file:py-1.5 file:text-[13px] file:font-semibold file:text-accent-deep" />
      </div>
      <div><label className="label" htmlFor="sell-title">Title</label><input id="sell-title" name="title" required maxLength={80} placeholder="IKEA desk lamp, white" className="input" /></div>
      <div><label className="label" htmlFor="sell-desc">Description</label><textarea id="sell-desc" name="description" rows={3} placeholder="Any dents? Does it work? Why are you letting it go?" className="input" /></div>
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
              <input id="sell-price" name="price" type="number" min="0" step="0.5" inputMode="decimal" placeholder="0" disabled={free} className="input pl-7 disabled:opacity-50" />
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[14.5px] font-medium"><input type="checkbox" name="free" checked={free} onChange={(e) => setFree(e.target.checked)} className={check} /> Give it away</label>
          </div>
          {free ? <p className="mt-1.5 text-[13px] text-moss-deep">Free items count toward your giveaway draw tickets.</p>
            : tip && <p className="mt-1.5 text-[13px] text-muted">Similar {CATEGORIES.find((c) => c.slug === category)?.label.toLowerCase()} items here sold for about {money(tip.median)} ({tip.n} sales).</p>}
        </div>
        {category === "textbooks" && (
          <div><label className="label" htmlFor="sell-course">Course code</label><input id="sell-course" name="course_code" placeholder="MATH 301" className="input uppercase" /><p className="mt-1.5 text-[13px] text-muted">Students taking that course find it instantly.</p></div>
        )}
      </div>
      <HandoffFields />
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full sm:w-auto sm:justify-self-start">Post listing</SubmitButton>
    </form>
  );
}

function BulkForm() {
  const [state, action] = useActionState(createListingsBulk, undefined);
  const rows = Array.from({ length: 10 }, (_, i) => i);
  return (
    <form action={action} className="card grid gap-6 p-5 sm:p-8" encType="multipart/form-data">
      <p className="rounded-[10px] bg-moss/10 p-4 text-[14.5px]">One line per item. Photos are optional, an empty price means free, and empty rows are skipped. Add details to any of them later.</p>
      <div className="grid gap-2.5">
        <div className="hidden grid-cols-[2fr_1.2fr_90px_1.3fr] gap-2 px-1 text-[12px] font-semibold uppercase tracking-[.1em] text-muted sm:grid"><span>Item</span><span>Category</span><span>Price</span><span>Photo</span></div>
        {rows.map((i) => (
          <div key={i} className="grid grid-cols-[1fr_90px] gap-2 rounded-[12px] bg-bg p-2 sm:grid-cols-[2fr_1.2fr_90px_1.3fr] sm:bg-transparent sm:p-0">
            <input name={`title_${i}`} aria-label={`Item ${i + 1} name`} placeholder={`Item ${i + 1}`} className="input" />
            <input name={`price_${i}`} aria-label={`Item ${i + 1} price`} type="number" min="0" step="0.5" placeholder="Free" className="input sm:order-3" />
            <select name={`category_${i}`} aria-label={`Item ${i + 1} category`} className="input col-span-2 sm:order-2 sm:col-span-1">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
            <input type="file" name={`image_${i}`} aria-label={`Item ${i + 1} photo`} accept="image/*" className="input col-span-2 cursor-pointer text-[13px] file:mr-2 file:rounded-full file:border-0 file:bg-accent/15 file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-accent-deep sm:order-4 sm:col-span-1" />
          </div>
        ))}
      </div>
      <HandoffFields />
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full sm:w-auto sm:justify-self-start">Post all items</SubmitButton>
    </form>
  );
}

export function SellForms({ bulk, suggestions }: { bulk: boolean; suggestions: Suggestions }) {
  return (
    <div className="mx-auto grid max-w-2xl gap-10">
      <PageIntro eyebrow={bulk ? "Move-out mode" : "Sell or give away"} title={bulk ? "Clear out your room." : "List something."}
        sub={bulk ? "Ten things in two minutes. Most of it can just be free." : "A photo, a title and a price. Takes under a minute."}>
        <div role="tablist" aria-label="Listing mode" className="flex gap-1 rounded-full bg-fg/[.06] p-1">
          <Link role="tab" aria-selected={!bulk} href="/listings/new" className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition ${!bulk ? "bg-card shadow-[0_1px_3px_rgba(44,38,35,.12)]" : "text-muted hover:text-fg"}`}>One item</Link>
          <Link role="tab" aria-selected={bulk} href="/listings/new?mode=bulk" className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition ${bulk ? "bg-card shadow-[0_1px_3px_rgba(44,38,35,.12)]" : "text-muted hover:text-fg"}`}>Many items</Link>
        </div>
      </PageIntro>
      {bulk ? <BulkForm /> : <SingleForm suggestions={suggestions} />}
    </div>
  );
}
