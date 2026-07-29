import { Logo, cardStyle } from "@/components/shared";

interface Props {
  onNavigate: (p: string) => void;
  onLogout: () => void;
  adminName?: string;
}

const STATS = {
  total: 312,
  active: 47,
  pending: 8,
};

export default function AdminDashboard({ onNavigate, onLogout, adminName }: Props) {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}
    >
      {/* Top nav */}
      <header
        className="w-full flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(23,168,130,0.12)", color: "#17a882", border: "1px solid rgba(23,168,130,0.25)" }}
          >
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          {adminName && (
            <span className="text-sm hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
              {adminName}
            </span>
          )}
          <button
            onClick={onLogout}
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150"
            style={{ color: "var(--muted-foreground)", background: "var(--muted)", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#17a882"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Admin Dashboard </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage users, riders, and operations across Karachi.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Register new user */}
          <button
            onClick={() => onNavigate("admin-register")}
            className="w-full rounded-2xl p-6 flex items-center justify-between text-left transition-all duration-150"
            style={{ ...cardStyle, cursor: "pointer", border: "1px solid rgba(23,168,130,0.30)" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(23,168,130,0.20), 0 8px 40px rgba(23,168,130,0.16)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(23,168,130,0.06), 0 8px 40px rgba(23,168,130,0.10)"; }}
          >
            <div>
              <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                User Management
              </p>
              <p className="text-lg font-semibold mt-1" style={{ color: "#17a882" }}>Register new user</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                Add a new Operator, Customer, or Rider role
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(23,168,130,0.10)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#17a882" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
          </button>

          {/* Total Riders */}
          <div className="rounded-2xl p-6 flex items-center justify-between" style={cardStyle}>
            <div>
              <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Total Riders</p>
              <p className="text-4xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{STATS.total}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(23,168,130,0.10)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17a882" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          {/* Active Riders */}
          <div className="rounded-2xl p-6 flex items-center justify-between" style={cardStyle}>
            <div>
              <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Active Riders</p>
              <button
                onClick={() => onNavigate("active-riders")}
                className="text-4xl font-bold mt-1 transition-colors duration-150"
                style={{ color: "#17a882", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1.2 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#0d8f6e"; e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#17a882"; e.currentTarget.style.textDecoration = "none"; }}
              >
                {STATS.active}
              </button>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Tap to view live map →</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(23,168,130,0.10)" }}>
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#17a882" }} />
                <span className="relative inline-flex rounded-full h-4 w-4" style={{ background: "#17a882" }} />
              </span>
            </div>
          </div>

          {/* Pending Riders */}
          <div className="rounded-2xl p-6 flex items-center justify-between" style={cardStyle}>
            <div>
              <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Pending Riders</p>
              <button
                onClick={() => onNavigate("pending-riders")}
                className="text-4xl font-bold mt-1 transition-colors duration-150"
                style={{ color: "#f59e0b", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1.2 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#d97706"; e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.textDecoration = "none"; }}
              >
                {STATS.pending}
              </button>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Tap to review applications →</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.10)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
