import { LoginForm } from "@/components/auth/login-form";

const tindahanLogoStyle = {
  backgroundImage: "url('/tindahan-logo.png')",
  backgroundPosition: "center 50%",
  backgroundSize: "300%",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const hasError = Boolean((await searchParams).error);

  return (
    <main className="grid min-h-screen bg-[var(--surface)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#123d2e] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
        <div className="absolute -right-4 -top-4 size-64 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <span aria-label="Tindahan logo" className="size-10 rounded-lg bg-[var(--surface)] bg-no-repeat shadow-sm" style={tindahanLogoStyle} />
          <div><p className="text-lg font-bold leading-none">Tindahan</p><p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100/60">Business OS</p></div>
        </div>
        <div className="relative max-w-xl pb-12">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Built for business on the move</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight">Everything your business needs, right at the counter.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-emerald-50/70">Sales, inventory, customers, and clear reports in one focused workspace.</p>
        </div>
        <p className="relative text-xs text-emerald-100/45">© 2026 Tindahan Business Systems</p>
      </section>

      <section className="flex items-center justify-center bg-[var(--background)] px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span aria-label="Tindahan logo" className="size-10 rounded-lg bg-[#123d2e] bg-no-repeat shadow-sm" style={tindahanLogoStyle} />
            <p className="text-lg font-bold text-[var(--foreground)]">Tindahan</p>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Welcome back</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">Sign in to your workspace</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use your business account to continue.</p>

          <LoginForm hasError={hasError} />

          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
            <div className="mt-7 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
              <strong>Demo account</strong><br />demo · demo
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
