"use client";

import { useActionState } from "react";
import { setListingStatus, deleteListing } from "@/actions/listings";
import { boostListing } from "@/actions/game";
import { FormError, SubmitButton } from "./forms";

type Props = {
  listingId: number; status: string; buyerId: number | null; chatters: { id: number; name: string }[];
  confirmed: boolean; hasPhoto: boolean;
  boost: { active: boolean; until: string | null; cost: number; days: number; balance: number; other: string | null };
};

/** What the owner of a listing can do with it: boost it, say who it went to, or take it down. */
export function OwnerControls({ listingId, status, buyerId, chatters, confirmed, hasPhoto, boost }: Props) {
  const [state, action] = useActionState(setListingStatus, undefined);
  const [boosted, boostAction] = useActionState(boostListing, undefined);
  if (confirmed) {
    return (
      <div className="grid gap-2">
        <p className="eyebrow">Your listing</p>
        <p className="text-[14px]">The handoff is confirmed, so this one is finished and locked. It counts on your account page.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      <div className="grid gap-1"><p className="eyebrow">Your listing</p><h2 className="text-[22px]">Manage it</h2></div>

      {status === "available" && (
        <div className="grid gap-2 border border-line p-3.5" data-boost>
          {boost.active ? (
            <p className="text-[13.5px]"><b className="font-semibold">Boosted.</b> This listing sits at the top of the shelves until {boost.until}.</p>
          ) : (
            <form action={boostAction} className="grid gap-2">
              <input type="hidden" name="id" value={listingId} />
              <p className="text-[13.5px]"><b className="font-semibold">Boost this listing.</b> <span className="text-muted">Put it at the top of the shelves for {boost.days} days for ⭐ {boost.cost / 100} credits. You have ⭐ {boost.balance / 100}.</span></p>
              {boost.other ? <p className="text-[12.5px] text-muted">You&apos;re already boosting “{boost.other}”. One boost at a time.</p>
                : boost.balance < boost.cost ? <p className="text-[12.5px] text-muted">Every confirmed handoff earns you a credit.</p>
                : <SubmitButton className="btn-orange justify-self-start">Boost for ⭐ {boost.cost / 100}</SubmitButton>}
              <FormError error={boosted?.error} />
            </form>
          )}
        </div>
      )}

      <form action={action} className="grid gap-3">
        <input type="hidden" name="id" value={listingId} />
        <div>
          <label className="label" htmlFor="owner-status">Status</label>
          <select id="owner-status" name="status" defaultValue={status} className="input">
            <option value="available">Available</option>
            <option value="pending">Reserved</option>
            <option value="sold">Gone (sold or given away)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="owner-buyer">To whom <span className="font-normal text-muted">(people who messaged you)</span></label>
          <select id="owner-buyer" name="buyer_id" defaultValue={buyerId ?? ""} className="input">
            <option value="">Nobody in particular</option>
            {chatters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="mt-1.5 text-[12.5px] text-muted">Pick who got it and ask them to confirm. That&apos;s what earns you points and a credit.{hasPhoto ? "" : " Handoffs only count when the listing has a photo."}</p>
        </div>
        <FormError error={state?.error} />
        <SubmitButton className="btn-primary w-full">Update</SubmitButton>
      </form>
      <form action={deleteListing}><input type="hidden" name="id" value={listingId} /><button className="btn-ghost w-full hover:border-accent-deep hover:text-accent-deep">Delete listing</button></form>
    </div>
  );
}
