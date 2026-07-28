import { useEffect, useState } from "react";
import { BackButton, Logo, cardStyle, inputBase, focusInput, blurInput, btnPrimary } from "../components/shared";
import type { Profile } from "../App";

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PendingRiders({ onBack, riders: initialRiders }: { onBack: () => void; riders: Profile[] }) {
  const [riders, setRiders] = useState<Profile[]>(initialRiders);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [form, setForm] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  console.debug("PendingRiders: initialRiders", initialRiders);

  useEffect(() => {
    setRiders(initialRiders);
    setSelectedName(null);
    setForm(null);
  }, [initialRiders]);

  const selectRider = (name: string) => {
    const rider = riders.find((r) => r.name === name) ?? null;
    setSelectedName(name);
    setForm(rider ? { ...rider } : null);
    setSaved(false);
  };

  const setField = <K extends keyof Profile>(field: K, value: Profile[K]) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    if (field === "name" && typeof value === "string") {
      setSelectedName(value);
    }
    setSaved(false);
  };

  const generatePin = () => {
    if (!form) return;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setField("pin", pin);
  };

  const handleSave = () => {
    if (!form) return;
    setRiders((current) => current.map((x) => (x.name === form.name ? { ...form } : x)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}>
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
          {riders.length} pending
        </span>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Pending Riders</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Select a rider to review and update their profile details.
        </p>

        <div className="flex flex-col gap-1.5 mb-8">
          <label htmlFor="rider-select" className="text-sm font-medium" style={{ color: "#2d5045" }}>
            Select pending rider
          </label>
          <select
            id="rider-select"
            value={selectedName ?? ""}
            onChange={(e) => selectRider(e.target.value)}
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
            {riders.map((r) => (
              <option key={r.name} value={r.name}>{r.name} — {r.role}</option>
            ))}
          </select>
        </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone Number">
                <input value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Full name">
                <input value={form.name} onChange={(e) => setField("name", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Address">
                <input value={form.address} onChange={(e) => setField("address", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Ride area">
                <input value={form.rideArea} onChange={(e) => setField("rideArea", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Date of birth">
                <input type="date" value={form.dob} onChange={(e) => setField("dob", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Age (calculated)">
                <input readOnly value={form.dob ? `${calcAge(form.dob)} years` : "—"}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ ...inputBase, opacity: 0.65, cursor: "default" }} />
              </Field>

              <Field label="Joining date">
                <input type="date" value={form.joiningDate} onChange={(e) => setField("joiningDate", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Total rides">
                <input type="number" min="0" value={form.totalRides} onChange={(e) => setField("totalRides", Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Missed rides">
                <input type="number" min="0" value={form.missedRides} onChange={(e) => setField("missedRides", Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Distance traveled (km)">
                <input type="number" min="0" value={form.distanceTraveled} onChange={(e) => setField("distanceTraveled", Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Ratings">
                <input type="number" min="0" step="0.1" value={form.ratings} onChange={(e) => setField("ratings", Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>

              <Field label="Last customer ID">
                <input value={form.lastCustomerId} onChange={(e) => setField("lastCustomerId", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={inputBase} onFocus={focusInput} onBlur={blurInput} />
              </Field>
            </div>

            <Field label="Online status">
              <label className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--input-background)", border: "1px solid var(--border)" }}>
                <input type="checkbox" checked={Boolean(form.online)} disabled readOnly />
                <span style={{ color: form.online ? "var(--foreground)" : "var(--muted-foreground)" }}>
                  {form.online ? "Rider is currently online" : "Rider is currently offline"}
                </span>
              </label>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Current PIN">
                <div className="flex gap-2">
                  <input
                    value={form.pin ?? ""}
                    onChange={(e) => setField("pin", e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
                    style={inputBase}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button
                    type="button"
                    onClick={generatePin}
                    className="rounded-xl px-4 py-3 text-sm font-semibold"
                    style={btnPrimary}
                  >
                    Generate PIN
                  </button>
                </div>
              </Field>

              <Field label="Activate Rider">
                <label className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--input-background)", border: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={Boolean(form.activated)} onChange={() => setField("activated", !Boolean(form.activated))} />
                  <span style={{ color: form.activated ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    {form.activated ? "Rider is active" : "Rider is inactive"}
                  </span>
                </label>
              </Field>
            </div>

            <div className="flex gap-3 mt-2 flex-wrap">
              <button
                onClick={handleSave}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
                style={{ background: "var(--muted)", color: "var(--foreground)", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--muted)"; }}
              >
                Save changes
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
