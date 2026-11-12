import api from "../../../lib/api";
import type {
  AuthResponse,
  LoginPayload,
  LoginResponse,
  MessageResponse,
  RegisterPayload,
  User,
} from "../types/auth";
import type {
  RecoveryCodesPayload,
  RecoveryCodesResponse,
  TwoFactorChallengePayload,
  TwoFactorChallengeResponse,
  TwoFactorConfirmPayload,
  TwoFactorDisablePayload,
  TwoFactorDisableResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from "../types/twoFactor";

export async function getCsrfCookie(): Promise<void> {
  await api.get("/sanctum/csrf-cookie");
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  await getCsrfCookie();

  const response = await api.post<AuthResponse>("/api/register", payload);

  return response.data;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  await getCsrfCookie();

  const response = await api.post<LoginResponse>("/api/login", payload);

  return response.data;
}

export async function completeTwoFactorChallenge(
  payload: TwoFactorChallengePayload,
): Promise<TwoFactorChallengeResponse> {
  await getCsrfCookie();

  const response = await api.post<TwoFactorChallengeResponse>(
    "/api/two-factor/challenge",
    payload,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/api/user");

  return response.data;
}

export async function logout(): Promise<MessageResponse> {
  await getCsrfCookie();

  const response = await api.post<MessageResponse>("/api/logout");

  return response.data;
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await api.get<TwoFactorStatus>("/api/two-factor/status");

  return response.data;
}

export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  await getCsrfCookie();

  const response = await api.post<TwoFactorSetupResponse>(
    "/api/two-factor/setup",
  );

  return response.data;
}

export async function confirmTwoFactor(
  payload: TwoFactorConfirmPayload,
): Promise<MessageResponse> {
  await getCsrfCookie();

  const response = await api.post<MessageResponse>(
    "/api/two-factor/confirm",
    payload,
  );

  return response.data;
}

export async function regenerateRecoveryCodes(
  payload: RecoveryCodesPayload,
): Promise<RecoveryCodesResponse> {
  await getCsrfCookie();

  const response = await api.post<RecoveryCodesResponse>(
    "/api/two-factor/recovery-codes/regenerate",
    payload,
  );

  return response.data;
}

export async function disableTwoFactor(
  payload: TwoFactorDisablePayload,
): Promise<TwoFactorDisableResponse> {
  await getCsrfCookie();

  const response = await api.post<TwoFactorDisableResponse>(
    "/api/two-factor/disable",
    payload,
  );

  return response.data;
}
