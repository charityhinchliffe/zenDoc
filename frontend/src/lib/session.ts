const LOCAL_KEY = "zendoc-session";

export type AccountSession = {
  accessToken: string;
  id: number;
  email: string;
  fullName: string;
};

export function saveSession(session: AccountSession, remember: boolean) {
  const raw = JSON.stringify(session);
  if (remember) {
    window.localStorage.setItem(LOCAL_KEY, raw);
    window.sessionStorage.removeItem(LOCAL_KEY);
    return;
  }
  window.sessionStorage.setItem(LOCAL_KEY, raw);
  window.localStorage.removeItem(LOCAL_KEY);
}

export function getSession(): AccountSession | null {
  return read(window.sessionStorage) ?? read(window.localStorage);
}

export function clearSession() {
  window.localStorage.removeItem(LOCAL_KEY);
  window.sessionStorage.removeItem(LOCAL_KEY);
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ZD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function read(storage: Storage): AccountSession | null {
  try {
    const raw = storage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccountSession;
    if (!parsed?.accessToken || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}
