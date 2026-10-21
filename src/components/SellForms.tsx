"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createListing, createListingsBulk } from "@/actions/listings";
import { CATEGORIES, CONDITIONS, HANDOFF, HANDOFF_SPOTS } from "@/lib/config";
import { money } from "@/lib/format";
import { FormError, SubmitButton } from "./forms";

type Suggestions = Record<string, { median: number; n: number } | null>;

function HandoffFields() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="accepts_credits" /> Accept ⭐ credits as payment <span className="text-xs text-muted">(1 credit = $1 of price; people win them in the giveaway draw)</span></label>
      <div>
        <label className="label">Handoff</label>
        <select name="handoff" className="input">{HANDOFF.map((h) => <option key={h.slug} value={h.slug}>{h.label}</option>)}</select>
        <p className="mt-1 text-xs text-muted">“Fall” means it goes into summer storage and the buyer collects it at move-in. Great for leavers.</p>
      </div>
      <div>
        <label className="label">Where to meet</label>
        <select name="spot" className="input"><option value="">— pick a spot —</option>{HANDOFF_SPOTS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
    </div>
  );
}

function SingleForm({ suggestions }: { suggestions: Suggestions }) {
  const [state, action] = useActionState(createListing, undefined);
  const [free, setFree] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0].slug);
  const tip = suggestions[category];
  return (
    <form action={action} className="space-y-4" encType="multipart/form-data">
      <div>
        <label className="label">Photos <span className="font-normal">(up to 6, first one is the cover)</span></label>
        <input type="file" name="images" accept="image/*" multiple className="input" />
      </div>
      <div><label className="label">Title</label><input name="title" required maxLength={80} placeholder="e.g. IKEA desk lamp, white" className="input" /></div>
      <div><label className="label">Description</label><textarea name="description" rows={3} placeholder="Any dents, does it work, why you're selling…" className="input" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Category</label>
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="input">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
        </div>
        <div><label className="label">Condition</label><select name="condition" defaultValue="Good" className="input">{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Price</label>
          <div className="flex items-center gap-3">
            <input name="price" type="number" min="0" step="0.5" inputMode="decimal" placeholder="0" disabled={free} className="input" />
            <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" name="free" checked={free} onChange={(e) => setFree(e.target.checked)} /> Free 🎁</label>
          </div>
          {tip && !free && <p className="mt-1 text-xs text-muted">Similar {CATEGORIES.find((c) => c.slug === category)?.label.toLowerCase()} items here sold for about {money(tip.median)} ({tip.n} sales).</p>}
        </div>
        {category === "textbooks" && (
          <div><label className="label">Course code</label><input name="course_code" placeholder="e.g. MATH 301" className="input uppercase" /><p className="mt-1 text-xs text-muted">Students taking that course can find it instantly.</p></div>
        )}
      </div>
      <HandoffFields />
      <FormError error={state?.error} />
      <SubmitButton>Post listing</SubmitButton>
    </form>
  );
}

function BulkForm() {
  const [state, action] = useActionState(createListingsBulk, undefined);
  const rows = Array.from({ length: 10 }, (_, i) => i);
  return (
    <form action={action} className="space-y-4" encType="multipart/form-data">
      <p className="rounded-lg bg-accent/10 p-3 text-sm">Move-out mode: one line per item, photo optional. Leave the price empty to give it away. Empty rows are skipped. You can add details later.</p>
      <div className="space-y-2">
        {rows.map((i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-line bg-card p-2 sm:grid-cols-[2fr_1.2fr_80px_1.2fr]">
            <input name={`title_${i}`} placeholder={`Item ${i + 1}`} className="input" />
            <select name={`category_${i}`} className="input order-3 sm:order-none">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
            <input name={`price_${i}`} type="number" min="0" step="0.5" placeholder="Free" className="input" />
            <input type="file" name={`image_${i}`} accept="image/*" className="input order-4 col-span-2 text-xs sm:order-none sm:col-span-1" />
          </div>
        ))}
      </div>
      <HandoffFields />
      <FormError error={state?.error} />
      <SubmitButton>Post all items</SubmitButton>
    </form>
  );
}

export function SellForms({ bulk, suggestions }: { bulk: boolean; suggestions: Suggestions }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{bulk ? "Clear out your room" : "List an item"}</h1>
        <div className="flex gap-1">
          <Link href="/listings/new" className={bulk ? "chip" : "chip-on"}>One item</Link>
          <Link href="/listings/new?mode=bulk" className={bulk ? "chip-on" : "chip"}>Many items</Link>
        </div>
      </div>
      {bulk ? <BulkForm /> : <SingleForm suggestions={suggestions} />}
    </div>
  );
}
