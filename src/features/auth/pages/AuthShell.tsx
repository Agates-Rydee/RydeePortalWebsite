// Visual chrome shared by /login, /register, and /admin/register.
// D8 restyle Phase 1: unchanged layout, tokens now via Tailwind classes.
import type { ReactNode } from "react";
import { Bg } from "@/components/shared";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Bg />
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {children}
        <p className="mt-8 text-xs text-center text-muted-foreground">
          Rydee · Karachi, Pakistan &nbsp;·&nbsp; Electric mobility for everyone
        </p>
      </div>
    </div>
  );
}
