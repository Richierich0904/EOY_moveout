"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, verify } from "@/actions/auth";
import { FormError, SubmitButton } from "./forms";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div><label className="label" htmlFor="login-email">School email</label><input id="login-email" name="email" type="email" required autoComplete="email" className="input" /></div>
      <div><label className="label" htmlFor="login-pw">Password</label><input id="login-pw" name="password" type="password" required autoComplete="current-password" className="input" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Log in</SubmitButton>
      <p className="text-center text-[14.5px] text-muted">New here? <Link href="/signup" className="a-link">Create an account</Link></p>
    </form>
  );
}

export function SignupForm({ houses, domains }: { houses: string[]; domains: string[] }) {
  const [state, action] = useActionState(signup, undefined);
  const y = new Date().getFullYear();
  return (
    <form action={action} className="grid gap-4">
      <div><label className="label" htmlFor="su-email">School email</label><input id="su-email" name="email" type="email" required autoComplete="email" placeholder={domains[0] ? `you@${domains[0]}` : "you@school.edu"} className="input" />
        {domains.length > 0 && <p className="mt-1.5 text-[13px] text-muted">Only {domains.map((d) => "@" + d).join(", ")} addresses can join. That&apos;s how everyone here is a real student.</p>}</div>
      <div><label className="label" htmlFor="su-name">Full name</label><input id="su-name" name="name" required autoComplete="name" className="input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="su-house">House</label><select id="su-house" name="house" className="input">{houses.map((h) => <option key={h}>{h}</option>)}</select></div>
        <div><label className="label" htmlFor="su-year">Graduation year</label><select id="su-year" name="grad_year" defaultValue={y + 1} className="input">{Array.from({ length: 7 }, (_, i) => y + i).map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
      </div>
      <div><label className="label" htmlFor="su-pw">Password</label><input id="su-pw" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Create account</SubmitButton>
      <p className="text-center text-[14.5px] text-muted">Already joined? <Link href="/login" className="a-link">Log in</Link></p>
    </form>
  );
}

export function VerifyForm({ devCode }: { devCode: string | null }) {
  const [state, action] = useActionState(verify, undefined);
  return (
    <form action={action} className="grid gap-4">
      {devCode && <p className="rounded-[10px] bg-moss/12 p-3.5 text-[14.5px]">Email sending isn&apos;t set up yet, so here&apos;s your code: <b className="font-mono text-[18px] tracking-[.2em]">{devCode}</b></p>}
      <div><label className="label" htmlFor="verify-code">6-digit code</label><input id="verify-code" name="code" inputMode="numeric" pattern="[0-9]{6}" required autoFocus className="input text-center font-mono text-[26px] tracking-[.5em]" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Verify</SubmitButton>
    </form>
  );
}
