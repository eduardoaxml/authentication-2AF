import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import { getApiError } from "../utils/getApiError";

export default function TwoFactorChallengePage() {
  const navigate = useNavigate();

  const { completeTwoFactor, requiresTwoFactor, isAuthenticated } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requiresTwoFactor) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await completeTwoFactor(code.trim());
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      setError(
        getApiError(error, "Unable to verify your authentication code."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700">
            SecureAuth
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Two-factor authentication
          </h1>

          <p className="mt-3 leading-relaxed text-slate-500">
            Your account is protected by an additional security layer. Enter the
            six-digit code from your authenticator app or use one of your
            recovery codes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Authentication code
            </label>

            <input
              id="code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter your code"
              autoComplete="one-time-code"
              maxLength={32}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            />

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              You can enter an authenticator code or a recovery code.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify and continue"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            ← Return to login
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Secure authentication for your account.
        </p>
      </section>
    </main>
  );
}
