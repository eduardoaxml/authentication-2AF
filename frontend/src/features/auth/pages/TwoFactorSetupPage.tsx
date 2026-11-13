import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import { confirmTwoFactor, setupTwoFactor } from "../services/authService";
import type { TwoFactorSetupResponse } from "../types/twoFactor";
import { getApiError } from "../utils/getApiError";

export default function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSetup() {
      try {
        const response = await setupTwoFactor();

        if (isMounted) {
          setSetup(response);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setError(getApiError(error, "Unable to start two-factor setup."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingSetup(false);
        }
      }
    }

    if (!isLoading && isAuthenticated) {
      void loadSetup();
    }

    return () => {
      isMounted = false;
    };
  }, [isLoading, isAuthenticated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await confirmTwoFactor({ code: code.trim() });
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      setError(
        getApiError(error, "Unable to confirm two-factor authentication."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-sm font-medium text-slate-500">
          Loading your account...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
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
            to="/settings/security"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Security settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
            Account protection
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Set up two-factor authentication
          </h1>

          <p className="mt-3 leading-relaxed text-slate-500">
            Connect an authenticator app to add another layer of security to
            your account.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
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
              <h2 className="text-lg font-bold text-slate-900">
                Authenticator setup
              </h2>
              <p className="text-sm text-slate-500">
                Follow the steps below to enable 2FA.
              </p>
            </div>
          </div>

          {isLoadingSetup && (
            <div className="rounded-xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">
                Generating your QR code...
              </p>
            </div>
          )}

          {setup && (
            <div className="space-y-7">
              <div className="rounded-xl bg-slate-50 p-6">
                <div className="mb-5">
                  <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                    1
                  </span>

                  <h3 className="font-semibold text-slate-900">
                    Scan the QR code
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Open your authenticator app and scan this code.
                  </p>
                </div>

                <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <img
                    src={setup.qr_code}
                    alt="Two-factor authentication QR code"
                    width={250}
                    height={250}
                    className="h-auto w-full max-w-[250px]"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="font-semibold text-blue-900">
                  Can't scan the QR code?
                </h3>

                <p className="mt-2 text-sm text-blue-800">
                  Enter this setup key manually in your authenticator app.
                </p>

                <div className="mt-4 break-all rounded-lg border border-blue-100 bg-white px-4 py-3">
                  <code className="font-mono text-sm font-semibold tracking-wider text-slate-800">
                    {setup.secret}
                  </code>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="mb-3">
                    <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                      2
                    </span>

                    <h3 className="font-semibold text-slate-900">
                      Verify your authenticator
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter the six-digit code generated by your app.
                    </p>
                  </div>

                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Authenticator code
                  </label>

                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="123456"
                    className={inputClassName}
                    required
                  />
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
                  {isSubmitting ? "Verifying..." : "Enable 2FA"}
                </button>
              </form>
            </div>
          )}

          {!setup && error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </section>

        <div className="mt-8">
          <Link
            to="/settings/security"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            ← Back to security settings
          </Link>
        </div>
      </div>
    </main>
  );
}
