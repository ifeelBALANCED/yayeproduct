// [11] Вхід для фахівців — Coming soon (MVP-демо показує тільки скріншот)

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-serif text-3xl italic text-ink">Я є</p>
          <p className="mt-1 font-sans text-sm text-inkSoft">портал для фахівців</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-inkSoft">email</label>
            <input
              type="email"
              disabled
              placeholder="name@clinic.ua"
              className="w-full rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink placeholder:text-inkSoft/40 opacity-60"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-inkSoft">
              пароль
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full rounded-2xl border border-divider bg-bgSoft px-4 py-3 font-sans text-base text-ink placeholder:text-inkSoft/40 opacity-60"
            />
          </div>

          <button
            disabled
            className="w-full rounded-2xl bg-accent/40 py-3.5 font-sans text-base text-white cursor-not-allowed"
          >
            coming soon
          </button>
        </div>

        <p className="text-center font-sans text-xs text-inkSoft">верифікація фахівців — Phase 3</p>
      </div>
    </main>
  );
}
