"use client";

import { useActionState } from "react";
import { changePassword, deleteAccount, updateProfile } from "@/actions/account";
import { FormError, FormNote, SubmitButton, useKeptForm } from "./forms";

const check = "mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--pop)]";

export function ProfileForm({ user, houses }: { user: { name: string; house: string; grad_year: number; hide_from_rankings: number }; houses: string[] }) {
  const [state, onSubmit, pending] = useKeptForm(updateProfile);
  const y = new Date().getFullYear();
  const years = Array.from(new Set([user.grad_year, ...Array.from({ length: 8 }, (_, i) => y + i)])).sort();
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div><label className="label" htmlFor="set-name">Full name</label><input id="set-name" name="name" required maxLength={60} defaultValue={user.name} autoComplete="name" className="input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="set-house">Dorm</label><select id="set-house" name="house" defaultValue={user.house} className="input">{houses.map((h) => <option key={h}>{h}</option>)}</select></div>
        <div><label className="label" htmlFor="set-year">Graduation year</label><select id="set-year" name="grad_year" defaultValue={user.grad_year} className="input">{years.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
      </div>
      <label className="flex items-start gap-3 bg-bg-deep p-3.5 text-[13.5px]">
        <input type="checkbox" name="hide_from_rankings" defaultChecked={user.hide_from_rankings === 1} className={check} />
        <span><b className="font-semibold">Hide me from the rankings.</b> <span className="text-muted">Your handoffs still count for your dorm and your own progress, but your name won&apos;t be on the tables and you won&apos;t win ranking prizes.</span></span>
      </label>
      <FormError error={state?.error} /><FormNote note={state?.message} />
      <SubmitButton pending={pending} className="btn-primary justify-self-start">Save</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div><label className="label" htmlFor="set-current">Current password</label><input id="set-current" name="current" type="password" required autoComplete="current-password" className="input" /></div>
      <div><label className="label" htmlFor="set-new">New password</label><input id="set-new" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" /></div>
      <FormError error={state?.error} /><FormNote note={state?.message} />
      <SubmitButton className="btn-ghost justify-self-start">Change password</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="grid gap-4">
      <p className="text-[13.5px] text-muted">This removes your account, your listings, your wanted posts, your messages and your photos. It can&apos;t be undone.</p>
      <div><label className="label" htmlFor="set-del">Type your password to confirm</label><input id="set-del" name="password" type="password" required autoComplete="current-password" className="input" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-ghost justify-self-start hover:border-accent-deep hover:text-accent-deep">Delete my account</SubmitButton>
    </form>
  );
}
