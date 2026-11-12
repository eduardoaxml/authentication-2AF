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
    return <p>Loading security settings...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Security settings</h1>

        {error && <p role="alert">{error}</p>}

        {status && (
          <>
            <section>
              <h2>Two-factor authentication</h2>

              <p>
                Status:{" "}
                <strong>
                  {status.two_factor_enabled ? "Enabled" : "Disabled"}
                </strong>
              </p>

              {status.two_factor_enabled ? (
                <>
                  <p>
                    Recovery codes remaining: {status.recovery_codes_remaining}
                  </p>

                  <p>Your account has an additional layer of security.</p>

                  <h2>Recovery codes</h2>

                  <p>
                    Recovery codes let you sign in if you cannot access your
                    authenticator app.
                  </p>

                  {recoveryCodes.length > 0 ? (
                    <section>
                      <p>
                        <strong>Save these codes somewhere secure.</strong> They
                        will not be shown again.
                      </p>

                      <ul>
                        {recoveryCodes.map((code) => (
                          <li key={code}>
                            <code>{code}</code>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : (
                    <p>
                      Generate a new set of recovery codes. Previously generated
                      codes will become invalid.
                    </p>
                  )}

                  <form onSubmit={handleGenerateRecoveryCodes}>
                    <label htmlFor="password">
                      Confirm your current password
                    </label>

                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />

                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Generating..."
                        : recoveryCodes.length > 0
                          ? "Regenerate recovery codes"
                          : "Generate recovery codes"}
                    </button>
                  </form>

                  <hr />

                  <h2>Disable two-factor authentication</h2>

                  <p>
                    This removes the additional authentication requirement and
                    deletes your existing recovery codes.
                  </p>

                  <form onSubmit={handleDisableTwoFactor}>
                    <label htmlFor="disable-password">Current password</label>

                    <input
                      id="disable-password"
                      type="password"
                      autoComplete="current-password"
                      value={disablePassword}
                      onChange={(event) =>
                        setDisablePassword(event.target.value)
                      }
                      required
                    />

                    <label htmlFor="disable-code">Authenticator code</label>

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
                      required
                    />

                    <button type="submit" disabled={isDisabling}>
                      {isDisabling ? "Disabling..." : "Disable 2FA"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p>
                    Protect your account by requiring an authenticator code when
                    signing in.
                  </p>

                  <Link to="/settings/security/setup">
                    Set up two-factor authentication
                  </Link>
                </>
              )}
            </section>
          </>
        )}

        <p>
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </section>
    </main>
  );
}
