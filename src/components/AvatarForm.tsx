"use client";

import { useActionState, useRef } from "react";
import { removeAvatar, updateAvatar } from "@/actions/profile";
import { Face } from "./Avatar";

/** Profile photo with a "Change photo" control. Picking a file uploads it straight away. */
export function AvatarForm({ name, avatar }: { name: string; avatar: string | null }) {
  const [state, action, pending] = useActionState(updateAvatar, undefined);
  const form = useRef<HTMLFormElement>(null);
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Face name={name} avatar={avatar} size={88} className={pending ? "opacity-50" : ""} />
        {pending && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[.08em]">Uploading</span>}
      </div>
      <div className="grid gap-1.5">
        <form ref={form} action={action}>
          <label htmlFor="avatar-file" className="chip cursor-pointer">{avatar ? "Change photo" : "Add a photo"}</label>
          <input id="avatar-file" name="avatar" type="file" accept="image/*" className="sr-only"
            onChange={() => form.current?.requestSubmit()} />
        </form>
        {avatar && <form action={removeAvatar}><button className="text-[11.5px] text-muted underline-offset-2 hover:text-fg hover:underline">Remove photo</button></form>}
        {state?.error && <p role="alert" className="text-[12px] text-fg">{state.error}</p>}
      </div>
    </div>
  );
}
