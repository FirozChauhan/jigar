// Tiny TTL cache on top of localStorage for playlist/track responses so the
// UI renders instantly on revisits.

const FIVE_MINUTES = 5 * 60 * 1000;

export function readCache<T>(key: string, maxAge = FIVE_MINUTES): T | null {
  const raw = localStorage.getItem(key);
  const at = localStorage.getItem(`${key}@time`);
  if (!raw || !at) return null;
  if (Date.now() - Number(at) > maxAge) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}@time`, Date.now().toString());
  } catch {
    // storage unavailable (private mode, quota) — degrade gracefully
  }
}

export function clearCache(prefix: string) {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) doomed.push(k);
    if (k && k.indexOf("@time") > -1 && k.startsWith(prefix)) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
}