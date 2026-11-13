import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import {
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
} from "../services/authService";
import type { TwoFactorStatus } from "../types/twoFactor";
import { getApiError } from "../utils/getApiError";

export default function SecuritySettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  async function handleDisableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsDisabling(true);

    try {
      await disableTwoFactor({
        password: disablePassword,
        code: disableCode,
      });

      setStatus((currentStatus) =>
        currentStatus
          ? {
              ...currentStatus,
              two_factor_enabled: false,
              two_factor_confirmed_at: null,
              recovery_codes_remaining: 0,
            }
          : currentStatus,
      );

      setRecoveryCodes([]);
      setPassword("");
      setDisablePassword("");
      setDisableCode("");
    } catch (error: unknown) {
      setError(
        getApiError(error, "Unable to disable two-factor authentication."),
      );
    } finally {
      setIsDisabling(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await getTwoFactorStatus();

        if (isMounted) {
          setStatus(response);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setError(getApiError(error, "Unable to load security settings."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      }
    }

    if (!isLoading && isAuthenticated) {
      void loadStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [isLoading, isAuthenticated]);

  async function handleGenerateRecoveryCodes(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await regenerateRecoveryCodes({ password });

      setRecoveryCodes(response.recovery_codes);
      setPassword("");

      setStatus((currentStatus) =>
        currentStatus
          ? {
              ...currentStatus,
              recovery_codes_remaining: response.recovery_codes.length,
            }
          : currentStatus,
      );
    } catch (error: unknown) {
      setError(getApiError(error, "Unable to generate recovery codes."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isLoadingStatus) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-sm font-medium text-slate-500">
          Loading security settings...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

  const labelClassName = "mb-2 block text-sm font-medium text-slate-700";

  const primaryButtonClassName =
    "w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              2F
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              SecureAuth
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Page content */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
            Account protection
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Security settings
          </h1>

          <p className="mt-3 text-slate-500">
            Manage two-factor authentication and protect access to your account.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {status && (
          <div className="space-y-6">
            {/* Two-factor status */}
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
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

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Two-factor authentication
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Add an extra layer of protection when signing in to your
                      account.
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    status.two_factor_enabled
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status.two_factor_enabled
                        ? "bg-green-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {status.two_factor_enabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              {status.two_factor_enabled ? (
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-sm font-medium text-slate-500">
                        Recovery codes remaining
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {status.recovery_codes_remaining}
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 p-5">
                      <p className="text-sm font-medium text-blue-700">
                        Protection status
                      </p>

                      <p className="mt-2 text-lg font-bold text-blue-900">
                        Your account is protected
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <p className="mb-5 text-sm leading-relaxed text-slate-500">
                    Your account currently relies on your password alone. Enable
                    two-factor authentication to require an additional
                    authenticator code when signing in.
                  </p>

                  <Link
                    to="/settings/security/setup"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto"
                  >
                    Set up two-factor authentication
                  </Link>
                </div>
              )}
            </section>

            {status.two_factor_enabled && (
              <>
                {/* Recovery codes */}
                <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      Recovery codes
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Recovery codes let you sign in if you cannot access your
                      authenticator app. Keep them somewhere secure.
                    </p>
                  </div>

                  {recoveryCodes.length > 0 ? (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <p className="mb-4 text-sm font-semibold text-amber-800">
                        Save these codes somewhere secure. They will not be
                        shown again.
                      </p>

                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {recoveryCodes.map((code) => (
                          <li
                            key={code}
                            className="rounded-lg border border-amber-200 bg-white px-3 py-3 text-center"
                          >
                            <code className="font-mono text-sm font-semibold text-slate-800">
                              {code}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mb-6 rounded-xl bg-slate-50 p-5">
                      <p className="text-sm leading-relaxed text-slate-600">
                        Generate a new set of recovery codes. Previously
                        generated codes will become invalid.
                      </p>
                    </div>
                  )}

                  <form
                    onSubmit={handleGenerateRecoveryCodes}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="password" className={labelClassName}>
                        Confirm your current password
                      </label>

                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={inputClassName}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={primaryButtonClassName}
                    >
                      {isSubmitting
                        ? "Generating..."
                        : recoveryCodes.length > 0
                          ? "Regenerate recovery codes"
                          : "Generate recovery codes"}
                    </button>
                  </form>
                </section>

                {/* Disable two-factor authentication */}
                <section className="rounded-2xl border border-red-200 bg-white p-7 shadow-sm">
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-600">
                      Sensitive action
                    </p>

                    <h2 className="text-xl font-bold text-slate-900">
                      Disable two-factor authentication
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      This removes the additional authentication requirement and
                      deletes your existing recovery codes.
                    </p>
                  </div>

                  <form onSubmit={handleDisableTwoFactor} className="space-y-4">
                    <div>
                      <label
                        htmlFor="disable-password"
                        className={labelClassName}
                      >
                        Current password
                      </label>

                      <input
                        id="disable-password"
                        type="password"
                        autoComplete="current-password"
                        value={disablePassword}
                        onChange={(event) =>
                          setDisablePassword(event.target.value)
                        }
                        className={inputClassName}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="disable-code" className={labelClassName}>
                        Authenticator code
                      </label>

                      <input
                        id="disable-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={disableCode}
                        onChange={(event) => setDisableCode(event.target.value)}
                        placeholder="123456"
                        className={inputClassName}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isDisabling}
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDisabling ? "Disabling..." : "Disable 2FA"}
                    </button>
                  </form>
                </section>
              </>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
