"use client";

import { createWant } from "@/actions/social";
import { CATEGORIES } from "@/lib/config";
import { FormError, SubmitButton, useKeptForm } from "./forms";

export function WantForm() {
  const [state, onSubmit, pending] = useKeptForm(createWant);
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div><label className="label" htmlFor="want-title">I&apos;m looking for</label><input id="want-title" name="title" required maxLength={80} placeholder="e.g. Mini fridge, desk fan, AP Chem textbook" className="input" /></div>
      <div><label className="label" htmlFor="want-desc">Details</label><textarea id="want-desc" name="description" rows={3} maxLength={1000} placeholder="Size, condition you'd accept, when you need it by…" className="input" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="want-cat">Category</label><select id="want-cat" name="category" className="input">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></div>
        <div><label className="label" htmlFor="want-max">Max I&apos;d pay <span className="font-normal text-muted">(optional)</span></label><input id="want-max" name="max_price" type="number" min="0" max="5000" step="1" placeholder="Leave empty for any" className="input" /></div>
      </div>
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full sm:w-auto">Post it</SubmitButton>
    </form>
  );
}
