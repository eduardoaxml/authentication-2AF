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
    <main className="auth-page">
      <section className="auth-card">
        <h1>Two-factor authentication</h1>

        <p>
          Enter the six-digit code from your authenticator app or use one of
          your recovery codes.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="code">Authentication code</label>

          <input
            id="code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter your code"
            autoComplete="one-time-code"
            maxLength={32}
            required
          />

          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p>
          <Link to="/login">Return to login</Link>
        </p>
      </section>
    </main>
  );
}
