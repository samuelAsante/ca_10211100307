"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";

/**
 * Hook to synchronize a single state value with a URL query parameter.
 * Automatically keeps the URL and component state in sync on initial load,
 * updates, browser navigation (back/forward), and page refresh.
 *
 * @param key The query parameter key (e.g., "q", "page", "category")
 * @param defaultValue The fallback value when parameter is absent
 */
export function useQueryState<T extends string = string>(
  key: string,
  defaultValue: T = "" as T
): [T, (val: T | ((prev: T) => T)) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialValue = (searchParams.get(key) as T) ?? defaultValue;

  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Sync state if URL changes externally (e.g. browser back/forward buttons)
  useEffect(() => {
    const currentParam = searchParams.get(key) as T | null;
    const resolved = currentParam ?? defaultValue;
    if (resolved !== stateRef.current) {
      setState(resolved);
    }
  }, [searchParams, key, defaultValue]);

  const setQueryState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const nextValue =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(stateRef.current)
          : updater;

      setState(nextValue);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (nextValue && nextValue !== defaultValue) {
          url.searchParams.set(key, nextValue);
        } else {
          url.searchParams.delete(key);
        }
        window.history.replaceState(null, "", url.toString());
      }
    },
    [key, defaultValue]
  );

  return [state, setQueryState];
}

/**
 * Hook to synchronize an object of query parameters with the URL.
 * Preserves states across page reloads and back/forward navigation.
 *
 * @param defaults Default key-value pairs
 */
export function useQueryParamsState<T extends Record<string, string | number | undefined>>(
  defaults: T
): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const searchParams = useSearchParams();

  const getParamsFromUrl = useCallback((): T => {
    const result = { ...defaults };
    Object.keys(defaults).forEach((key) => {
      const val = searchParams.get(key);
      if (val !== null) {
        const defaultType = typeof defaults[key];
        if (defaultType === "number") {
          (result as any)[key] = Number(val);
        } else {
          (result as any)[key] = val;
        }
      }
    });
    return result;
  }, [searchParams, defaults]);

  const [state, setState] = useState<T>(getParamsFromUrl);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(getParamsFromUrl());
  }, [getParamsFromUrl]);

  const setQueryParams = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      const patch =
        typeof updates === "function" ? updates(stateRef.current) : updates;
      const nextState = { ...stateRef.current, ...patch };
      setState(nextState);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        Object.entries(nextState).forEach(([key, val]) => {
          const defaultVal = defaults[key];
          if (val !== undefined && val !== null && val !== "" && val !== defaultVal) {
            url.searchParams.set(key, String(val));
          } else {
            url.searchParams.delete(key);
          }
        });
        window.history.replaceState(null, "", url.toString());
      }
    },
    [defaults]
  );

  return [state, setQueryParams];
}
