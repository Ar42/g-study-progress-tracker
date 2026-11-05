import { AUTH_COOKIE, AUTH_MAX_AGE_SECONDS } from "../../config/constants";
import { env } from "../../config/env";

/**
 * Lightweight client-side gate for a personal app. Note: credentials are
 * bundled into the JS, so this keeps casual visitors out — it is not security.
 */
export function isAuthenticated(): boolean {
  return document.cookie.split(";").some((c) => c.trim() === `${AUTH_COOKIE}=true`);
}

export function login(username: string, password: string): boolean {
  if (username.trim() !== env.authUsername || password !== env.authPassword) return false;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=true; max-age=${AUTH_MAX_AGE_SECONDS}; path=/; SameSite=Strict${secure}`;
  return true;
}

export function logout(): void {
  document.cookie = `${AUTH_COOKIE}=; max-age=0; path=/`;
}
