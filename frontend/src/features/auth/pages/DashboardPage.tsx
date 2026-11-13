import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      // Keep the user on the dashboard if logout fails.
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              2F
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              SecureAuth
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
            Overview
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Welcome back, {user?.name}!
          </h1>

          <p className="mt-3 text-slate-500">
            Manage your account and keep your digital identity protected.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {/* Account card */}
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900">Your account</h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Your account information and profile details.
            </p>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Name
              </p>
              <p className="mt-1 font-medium text-slate-800">{user?.name}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email address
              </p>
              <p className="mt-1 break-all font-medium text-slate-800">
                {user?.email}
              </p>
            </div>
          </article>

          {/* Security card */}
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v3" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Account security
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Manage two-factor authentication and your account security.
            </p>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-slate-600">
                  Security settings available
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/settings/security")}
                className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Manage security settings
              </button>
            </div>
          </article>
        </section>

        {/* Welcome banner */}
        <section className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-900 p-8 text-white shadow-lg md:p-10">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">
              Stay protected
            </p>

            <h2 className="text-2xl font-bold md:text-3xl">
              Your security matters.
            </h2>

            <p className="mt-3 leading-relaxed text-blue-100">
              Add an extra layer of protection to your account with two-factor
              authentication.
            </p>

            <button
              type="button"
              onClick={() => navigate("/settings/security")}
              className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              Review security
            </button>
          </div>

          <div
            aria-hidden="true"
            className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 right-32 h-64 w-64 rounded-full border-[30px] border-white/5"
          />
        </section>
      </div>
    </main>
  );
}
