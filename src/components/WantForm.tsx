"use client";

import { useActionState } from "react";
import { createWant } from "@/actions/social";
import { CATEGORIES } from "@/lib/config";
import { FormError, SubmitButton } from "./forms";

export function WantForm() {
  const [state, action] = useActionState(createWant, undefined);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label">I&apos;m looking for</label><input name="title" required placeholder="e.g. Mini fridge, desk fan, AP Chem textbook" className="input" /></div>
      <div><label className="label">Details</label><textarea name="description" rows={3} placeholder="Size, condition you'd accept, when you need it by…" className="input" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Category</label><select name="category" className="input">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></div>
        <div><label className="label">Max I&apos;d pay <span className="font-normal">(optional)</span></label><input name="max_price" type="number" min="0" step="1" placeholder="Leave empty for any" className="input" /></div>
      </div>
      <FormError error={state?.error} />
      <SubmitButton>Post</SubmitButton>
    </form>
  );
}
