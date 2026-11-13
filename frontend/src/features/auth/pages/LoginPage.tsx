import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import { getApiError } from "../utils/getApiError";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, requiresTwoFactor } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiresTwoFactor) {
    return <Navigate to="/two-factor/challenge" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const twoFactorRequired = await login({ email, password });

      navigate(twoFactorRequired ? "/two-factor/challenge" : "/dashboard");
    } catch (error: unknown) {
      setError(getApiError(error, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700">
          Secure access
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>

        <p className="mt-3 text-slate-500">
          Sign in to continue to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 md:hidden">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-blue-700">
          Register
        </Link>
      </p>
    </div>
  );
}
