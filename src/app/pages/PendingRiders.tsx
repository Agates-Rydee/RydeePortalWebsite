import { useState } from "react";
import {
  PENDING_RIDERS, KARACHI_AREAS, VERIFICATION_DOCS,
  type PendingRider,
} from "../data/mockData";
import { BackButton, Logo, cardStyle, inputBase, focusInput, blurInput, btnPrimary } from "../components/shared";

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function PendingRiders({ onBack }: { onBack: () => void }) {
  const [riders, setRiders] = useState<PendingRider[]>(PENDING_RIDERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<PendingRider | null>(null);
  const [blocked, setBlocked] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);

  const selectRider = (id: number) => {
    const rider = riders.find(r => r.id === id) ?? null;
    setSelectedId(id);
    setForm(rider ? { ...rider } : null);
    setSaved(false);
  };

  const setField = (field: keyof PendingRider, value: string | string[]) => {
    setForm(f => f ? { ...f, [field]: value } : f);
    setSaved(false);
  };

  const toggleDoc = (doc: string) => {
    if (!form) return;
    const docs = form.documents.includes(doc)
      ? form.documents.filter(d => d !== doc)
      : [...form.documents, doc];
    setField("documents", docs);
  };

  const handleGeneratePin = () => {
    const pin = generatePin();
    setField("pin", pin);
  };

  const handleBlock = () => {
    if (!form) return;
    if (window.confirm(`Block rider ${form.name}? They will not be able to register.`)) {
      setBlocked(b => [...b, form.id]);
      setRiders(r => r.filter(x => x.id !== form.id));
      setSelectedId(null);
      setForm(null);
    }
  };

  const handleSave = () => {
    if (!form) return;
    setRiders(r => r.map(x => x.id === form.id ? { ...form } : x));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeRiders = riders.filter(r => !blocked.includes(r.id));

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}>
      {/* Header */}
      <header
        className="w-full flex items-center justify-between px-6 py-4"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} label="Dashboard" />
          <Logo size="sm" />
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
          {activeRiders.length} pending
        </span>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Pending Riders</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Select a rider to review and complete their registration.
        </p>

        {/* Dropdown */}
        <div className="flex flex-col gap-1.5 mb-8">
          <label htmlFor="rider-select" className="text-sm font-medium" style={{ color: "#2d5045" }}>
            Select pending rider
          </label>
          <select
            id="rider-select"
            value={selectedId ?? ""}
            onChange={(e) => selectRider(Number(e.target.value))}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 appearance-none"
            style={{
              ...inputBase,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235a8070' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: "2.5rem",
            }}
            onFocus={focusInput}
            onBlur={blurInput}
          >
            <option value="" disabled>Choose a rider to review…</option>
            {activeRiders.map(r => (
              <option key={r.id} value={r.id}>{r.name} — {r.phone}</option>
            ))}
          </select>
        </div>

        {/* Rider form */}
        {form && (
          <div className="rounded-2xl p-7 flex flex-col gap-5" style={cardStyle}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold" style={{ color: "var(--card-foreground)" }}>
                Rider Profile
              </h2>
              {saved && (
                <span className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: "rgba(23,168,130,0.12)", color: "#17a882" }}>
                  ✓ Saved
                </span>
              )}
            </div>

            {/* Name */}
            <Field label="Full name">
              <input value={form.name} onChange={e => setField("name", e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                style={inputBase} onFocus={focusInput} onBlur={blurInput} />
            </Field>

            {/* Phone */}
            <Field label="Phone number">
              <input value={form.phone} onChange={e => setField("phone", e.target.value)}
                type="tel" className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                style={inputBase} onFocus={focusInput} onBlur={blurInput} />
            </Field>

            {/* Area */}
            <Field label="Geographic area of interest">
              <select value={form.area} onChange={e => setField("area", e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 appearance-none"
                style={{
                  ...inputBase,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235a8070' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  paddingRight: "2.5rem",
                  color: form.area ? "var(--card-foreground)" : "#5a8070",
                }}
                onFocus={focusInput} onBlur={blurInput}>
                <option value="" disabled>Select area…</option>
                {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>

            {/* DOB + Age side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of birth">
                <input type="date" value={form.dob} onChange={e => setField("dob", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>
              <Field label="Age (calculated)">
                <input readOnly value={form.dob ? `${calcAge(form.dob)} years` : "—"}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ ...inputBase, opacity: 0.65, cursor: "default" }} />
              </Field>
            </div>

            {/* CNIC */}
            <Field label="CNIC number">
              <input value={form.cnic} onChange={e => setField("cnic", e.target.value)}
                placeholder="XXXXX-XXXXXXX-X"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                style={inputBase} onFocus={focusInput} onBlur={blurInput} />
            </Field>

            {/* Verification documents */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium" style={{ color: "#2d5045" }}>Verification documents</p>
              <div className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "var(--input-background)", border: "1px solid var(--border)" }}>
                {VERIFICATION_DOCS.map(doc => {
                  const checked = form.documents.includes(doc);
                  return (
                    <label key={doc} className="flex items-center gap-3 cursor-pointer select-none">
                      <span
                        onClick={() => toggleDoc(doc)}
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150"
                        style={{
                          background: checked ? "#17a882" : "var(--card)",
                          border: checked ? "none" : "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        {checked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm" style={{ color: checked ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {doc}
                      </span>
                      {checked && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(23,168,130,0.12)", color: "#17a882" }}>Received</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* PIN */}
            <Field label="Access PIN">
              <input
                value={form.pin}
                readOnly
                placeholder="Not yet generated"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono tracking-[0.25em]"
                style={{ ...inputBase, opacity: form.pin ? 1 : 0.5, cursor: "default", letterSpacing: form.pin ? "0.25em" : undefined }}
              />
            </Field>

            {/* Action buttons */}
            <div className="flex gap-3 mt-2 flex-wrap">
              <button
                onClick={handleGeneratePin}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
                style={btnPrimary}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 28px rgba(23,168,130,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(23,168,130,0.30)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {form.pin ? "Regenerate PIN" : "Generate PIN"}
              </button>

              <button
                onClick={handleSave}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
                style={{ background: "var(--muted)", color: "var(--foreground)", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--muted)"; }}
              >
                Save changes
              </button>

              <button
                onClick={handleBlock}
                className="rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200"
                style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; }}
              >
                Block rider
              </button>
            </div>
          </div>
        )}

        {!form && (
          <div className="rounded-2xl p-10 flex flex-col items-center justify-center text-center" style={{ ...cardStyle, boxShadow: "none" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(245,158,11,0.10)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No rider selected</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Choose a rider from the dropdown above to review their application.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium" style={{ color: "#2d5045" }}>{label}</p>
      {children}
    </div>
  );
}
