"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, requestReset, resendCode, resetPassword, signup, verify } from "@/actions/auth";
import { FormError, FormNote, SubmitButton, useKeptForm } from "./forms";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div><label className="label" htmlFor="login-email">School email</label><input id="login-email" name="email" type="email" required autoComplete="email" className="input" /></div>
      <div><label className="label" htmlFor="login-pw">Password</label><input id="login-pw" name="password" type="password" required autoComplete="current-password" className="input" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Log in</SubmitButton>
      <p className="flex flex-wrap justify-between gap-2 text-[13.5px] text-muted"><Link href="/reset" className="a-link">Forgot your password?</Link><span>New here? <Link href="/signup" className="a-link">Create an account</Link></span></p>
    </form>
  );
}

export function SignupForm({ houses, domains, staffNotice }: { houses: string[]; domains: string[]; staffNotice: string }) {
  const [state, onSubmit, pending] = useKeptForm(signup);
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div><label className="label" htmlFor="su-email">School email</label><input id="su-email" name="email" type="email" required autoComplete="email" maxLength={120} placeholder={domains[0] ? `smithj27@${domains[0]}` : "you@school.edu"} className="input" />
        {domains.length > 0 && <p className="mt-1.5 text-[13px] text-muted">Only student {domains.map((d) => "@" + d).join(", ")} addresses can join. That&apos;s how everyone here is a real student.</p>}</div>
      <div><label className="label" htmlFor="su-name">First and last name</label><input id="su-name" name="name" required maxLength={60} autoComplete="name" className="input" />
        <p className="mt-1.5 text-[13px] text-muted">Your last name has to match your school email. A nickname is fine for your first name.</p></div>
      <div><label className="label" htmlFor="su-house">Dorm</label><select id="su-house" name="house" className="input">{houses.map((h) => <option key={h}>{h}</option>)}</select>
        <p className="mt-1.5 text-[13px] text-muted">Your class year is read from your email address.</p></div>
      <div><label className="label" htmlFor="su-pw">Password</label><input id="su-pw" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" /></div>
      <label className="flex items-start gap-3 bg-bg-deep p-3.5 text-[13.5px]">
        <input type="checkbox" name="rules" required className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--pop)]" />
        <span>I&apos;ve read the <Link href="/rules" target="_blank" className="a-link font-semibold">rules</Link> and I&apos;ll follow them. <span className="text-muted">{staffNotice}</span></span>
      </label>
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full">Create account</SubmitButton>
      <p className="text-center text-[14.5px] text-muted">Already joined? <Link href="/login" className="a-link">Log in</Link></p>
    </form>
  );
}

export function VerifyForm({ devCode }: { devCode: string | null }) {
  const [state, action] = useActionState(verify, undefined);
  const [sent, resend] = useActionState(resendCode, undefined);
  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4">
        {devCode && <p className="bg-bg-deep p-3.5 text-[14.5px]">Demo mode: email sending isn&apos;t set up, so here&apos;s your code: <b className="font-mono text-[18px] tracking-[.2em]">{devCode}</b></p>}
        <div><label className="label" htmlFor="verify-code">6-digit code</label><input id="verify-code" name="code" inputMode="numeric" pattern="[0-9]{6}" required autoFocus autoComplete="one-time-code" className="input text-center font-mono text-[26px] tracking-[.5em]" /></div>
        <FormError error={state?.error} />
        <SubmitButton className="btn-primary w-full">Verify</SubmitButton>
      </form>
      <form action={resend} className="grid justify-items-center gap-2">
        <button className="more text-[14.5px]">Send a new code</button>
        <FormError error={sent?.error} />
        <FormNote note={sent?.message} />
      </form>
    </div>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div><label className="label" htmlFor="reset-email">School email</label><input id="reset-email" name="email" type="email" required autoComplete="email" className="input" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Email me a code</SubmitButton>
      <p className="text-center text-[14.5px] text-muted"><Link href="/login" className="a-link">Back to log in</Link></p>
    </form>
  );
}

export function ResetForm({ email }: { email: string }) {
  const [state, action] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="email" value={email} />
      <div><label className="label" htmlFor="reset-code">6-digit code</label><input id="reset-code" name="code" inputMode="numeric" pattern="[0-9]{6}" required autoFocus autoComplete="one-time-code" className="input text-center font-mono text-[26px] tracking-[.5em]" /></div>
      <div><label className="label" htmlFor="reset-pw">New password</label><input id="reset-pw" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" /></div>
      <FormError error={state?.error} />
      <SubmitButton className="btn-primary w-full">Set new password</SubmitButton>
      <p className="text-center text-[14.5px] text-muted"><Link href="/reset" className="a-link">Use a different email</Link></p>
    </form>
  );
}
