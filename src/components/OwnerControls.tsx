import { setListingStatus, deleteListing } from "@/actions/listings";

export function OwnerControls({ listingId, status, buyerId, chatters }: { listingId: number; status: string; buyerId: number | null; chatters: { id: number; name: string }[] }) {
  return (
    <div className="space-y-3 rounded-2xl border border-accent/40 bg-card p-4">
      <h2 className="font-bold">This is your listing</h2>
      <form action={setListingStatus} className="space-y-2">
        <input type="hidden" name="id" value={listingId} />
        <label className="label">Status</label>
        <select name="status" defaultValue={status} className="input">
          <option value="available">Available</option>
          <option value="pending">Reserved</option>
          <option value="sold">Gone (sold or given away)</option>
        </select>
        <label className="label">To whom? <span className="font-normal">(optional, from people who messaged you)</span></label>
        <select name="buyer_id" defaultValue={buyerId ?? ""} className="input">
          <option value="">— nobody in particular —</option>
          {chatters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-primary w-full">Update</button>
      </form>
      <form action={deleteListing}><input type="hidden" name="id" value={listingId} /><button className="btn-ghost w-full text-free">Delete listing</button></form>
    </div>
  );
}
