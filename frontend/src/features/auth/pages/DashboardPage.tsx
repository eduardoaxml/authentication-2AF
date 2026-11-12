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
    <main>
      <h1>Dashboard</h1>

      <p>Welcome, {user?.name}!</p>
      <p>{user?.email}</p>

      <button type="button" onClick={() => navigate("/settings/security")}>
        Security settings
      </button>

      <button type="button" onClick={handleLogout}>
        Sign out
      </button>
    </main>
  );
}
