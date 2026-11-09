import { redirect } from "next/navigation";

// The giveaway draw used to live here. Old links and notifications still work.
export default function OldDrawPage() {
  redirect("/draw");
}
