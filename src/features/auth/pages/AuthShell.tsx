// Visual chrome shared by /login, /register, and /admin/register.
// Copied byte-for-byte from the old src/App.tsx AuthShell +
// admin-register wrapper. Zero visual change vs pre-refactor.
import type { ReactNode } from "react";
import { Bg } from "@/components/shared";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}
    >
      <Bg />
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {children}
        <p className="mt-8 text-xs text-center" style={{ color: "#5a8070" }}>
          Rydee · Karachi, Pakistan &nbsp;·&nbsp; Electric mobility for everyone
        </p>
      </div>
    </div>
  );
}
