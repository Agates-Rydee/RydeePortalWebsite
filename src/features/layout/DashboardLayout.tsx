import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/features/layout/AppSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const TITLE_KEYS: Record<string, string> = {
  "/admin": "layout.title.dashboard",
  "/admin/register": "layout.title.registerUser",
  "/admin/all-riders": "layout.title.allRiders",
  "/admin/active-riders": "layout.title.activeRiders",
  "/admin/pending-riders": "layout.title.pendingRiders",
  "/admin/blocked-riders": "layout.title.blockedRiders",
  "/admin/rides": "layout.title.rides",
  "/operator": "layout.title.dashboard",
};

function titleKeyFor(pathname: string): string | null {
  if (TITLE_KEYS[pathname]) return TITLE_KEYS[pathname];
  if (pathname.startsWith("/admin/riders/") && pathname.endsWith("/edit")) {
    return "layout.title.editRider";
  }
  if (pathname.startsWith("/admin/rides/")) {
    return "layout.title.rideView";
  }
  return null;
}

export function DashboardLayout() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const key = titleKeyFor(pathname);
  const title = key ? t(key) : "";
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
          <LanguageSwitcher className="ms-auto" />
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
