import AppRouter from "./app/AppRouter";
import AuthProvider from "./features/auth/components/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
