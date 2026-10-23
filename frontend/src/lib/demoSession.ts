const SESSION_KEY = "zendoc-demo-session";

export type DemoSession = {
  name: string;
  email: string;
};

export function saveDemoSession(session: DemoSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getDemoSession(): DemoSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ZD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
