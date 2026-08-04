import { Outlet, useLocation } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/features/layout/AppSidebar";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/register": "Register user",
  "/admin/all-riders": "All riders",
  "/admin/active-riders": "Active riders",
  "/admin/pending-riders": "Pending riders",
  "/admin/blocked-riders": "Blocked riders",
  "/operator": "Dashboard",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/admin/riders/") && pathname.endsWith("/location")) {
    return "Rider location";
  }
  return "";
}

export function DashboardLayout() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
