import { isAdmin } from "@/lib/auth";
import { HeaderActions } from "./header-actions";
import { SidebarAdmin } from "./side-item";

// Server components: they read the session cookie, so they render inside <Suspense> in the layout.
export async function AdminTop() {
  return <HeaderActions admin={await isAdmin()} />;
}

export async function AdminSide() {
  return <SidebarAdmin admin={await isAdmin()} />;
}
