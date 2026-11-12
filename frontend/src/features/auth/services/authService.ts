import api from "../../../lib/api";

export async function getCsrfCookie(): Promise<void> {
  await api.get("/sanctum/csrf-cookie");
}
