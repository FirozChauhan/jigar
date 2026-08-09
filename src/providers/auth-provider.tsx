"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AUTH_MARKER = "jigar_auth";

function hasMarkerCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.split("=")[0] === AUTH_MARKER);
}

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialAuthenticated = false,
}: {
  children: React.ReactNode;
  /** Server-read session marker so SSR can render the authed shell. */
  initialAuthenticated?: boolean;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      // Reconcile against the real cookie after hydration (it may have
      // expired, or a session may have started in another tab).
      setIsAuthenticated(hasMarkerCookie());
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (username, password) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "same-origin",
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          return { ok: false, error: data?.error ?? "Invalid username or password" };
        }
        setIsAuthenticated(true);
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error. Please try again." };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsAuthenticated(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout }),
    [isAuthenticated, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}