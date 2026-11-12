import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import DashboardPage from "../features/auth/pages/DashboardPage";
import TwoFactorChallengePage from "../features/auth/pages/TwoFactorChallengePage";
import TwoFactorSetupPage from "../features/auth/pages/TwoFactorSetupPage";
import SecuritySettingsPage from "../features/auth/pages/SecuritySettingsPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings/security" element={<SecuritySettingsPage />} />

        <Route
          path="/settings/security/setup"
          element={<TwoFactorSetupPage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route
        path="/two-factor/challenge"
        element={<TwoFactorChallengePage />}
      />
    </Routes>
  );
}
