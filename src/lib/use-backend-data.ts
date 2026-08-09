"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "./cache";

interface Options {
  url: string;
  cacheKey?: string;
  /** do not read/write the local cache (live search) */
  skipCache?: boolean;
  onUnauthorized?: () => void;
}

export function useBackendData<T>({ url, cacheKey, skipCache, onUnauthorized }: Options) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let stale = false;

    const cached = !skipCache && cacheKey ? readCache<T>(cacheKey) : null;
    if (cached) {
      const id = window.setTimeout(() => {
        setData(cached);
        setLoading(false);
        setError(null);
      }, 0);
      return () => {
        window.clearTimeout(id);
        controller.abort();
      };
    }

    fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (res.status === 401) {
          onUnauthorized?.();
          throw new Error("Session expired");
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (stale) return;
        setData(json);
        if (!skipCache && cacheKey) writeCache(cacheKey, json);
      })
      .catch((err: unknown) => {
        if (stale) return;
        if ((err as Error)?.name === "AbortError") return;
        setError((err as Error)?.message ?? "Something went wrong");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });

    return () => {
      stale = true;
      controller.abort();
    };
  }, [url, cacheKey, skipCache, nonce, onUnauthorized]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  return { data, loading, error, reload };
}