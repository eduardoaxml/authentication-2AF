import axios from "axios";

interface ApiValidationError {
  message?: string;
  errors?: Record<string, string[]>;
}

export function getApiError(error: unknown, fallbackMessage: string): string {
  if (!axios.isAxiosError<ApiValidationError>(error)) {
    return fallbackMessage;
  }

  const errors = error.response?.data?.errors;

  if (errors) {
    const firstError = Object.values(errors).flat()[0];

    if (firstError) {
      return firstError;
    }
  }

  return error.response?.data?.message ?? fallbackMessage;
}
