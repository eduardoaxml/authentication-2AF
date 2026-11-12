import type { User } from "./auth";

export interface TwoFactorChallengePayload {
  code: string;
}

export interface TwoFactorChallengeResponse {
  message: string;
  user: User;
}

export interface TwoFactorStatus {
  two_factor_enabled: boolean;
  two_factor_confirmed_at: string | null;
  recovery_codes_remaining: number;
}

export interface TwoFactorSetupResponse {
  message: string;
  secret: string;
  qr_code: string;
}

export interface TwoFactorConfirmPayload {
  code: string;
}

export interface RecoveryCodesPayload {
  password: string;
}

export interface RecoveryCodesResponse {
  message: string;
  recovery_codes: string[];
}

export interface TwoFactorDisablePayload {
  password: string;
  code: string;
}

export interface TwoFactorDisableResponse {
  message: string;
  two_factor_enabled: false;
}

export interface TwoFactorChallengeStatusResponse {
  two_factor_required: boolean;
}
