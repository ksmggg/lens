const KEY = "lens.token";

/** The token lives in this tab by default; "remember" keeps it on the device until sign-out. */
export function readToken(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string, remember: boolean): void {
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  } catch {
    // Storage blocked: the token stays in memory for this load only.
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
