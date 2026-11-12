import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import AuthContext from "../../../contexts/auth-context";

import type { LoginPayload, RegisterPayload, User } from "../types/auth";

import {
  completeTwoFactorChallenge,
  getCurrentUser,
  getTwoFactorChallengeStatus,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from "../services/authService";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
      setRequiresTwoFactor(false);
    } catch {
      try {
        const challengeStatus = await getTwoFactorChallengeStatus();

        setUser(null);
        setRequiresTwoFactor(challengeStatus.two_factor_required);
      } catch {
        setUser(null);
        setRequiresTwoFactor(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload): Promise<boolean> => {
    const response = await loginService(payload);

    if (response.two_factor_required) {
      setUser(null);
      setRequiresTwoFactor(true);
      return true;
    }

    if (!response.user) {
      throw new Error("The login response did not contain a user.");
    }

    setUser(response.user);
    setRequiresTwoFactor(false);

    return false;
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      const response = await registerService(payload);

      setUser(response.user);
      setRequiresTwoFactor(false);
    },
    [],
  );

  const completeTwoFactor = useCallback(async (code: string): Promise<void> => {
    const response = await completeTwoFactorChallenge({ code });

    setUser(response.user);
    setRequiresTwoFactor(false);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await logoutService();

    setUser(null);
    setRequiresTwoFactor(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      requiresTwoFactor,
      login,
      register,
      completeTwoFactor,
      logout,
      refreshUser,
    }),
    [
      user,
      isLoading,
      requiresTwoFactor,
      login,
      register,
      completeTwoFactor,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
