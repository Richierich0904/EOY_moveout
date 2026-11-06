import { setListingStatus, deleteListing } from "@/actions/listings";

export function OwnerControls({ listingId, status, buyerId, chatters }: { listingId: number; status: string; buyerId: number | null; chatters: { id: number; name: string }[] }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1"><p className="eyebrow">Your listing</p><h2 className="text-[22px]">Manage it</h2></div>
      <form action={setListingStatus} className="grid gap-3">
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
        </div>
        <button className="btn-primary w-full">Update</button>
      </form>
      <form action={deleteListing}><input type="hidden" name="id" value={listingId} /><button className="btn-ghost w-full hover:border-accent-deep hover:text-accent-deep">Delete listing</button></form>
    </div>
  );
}
