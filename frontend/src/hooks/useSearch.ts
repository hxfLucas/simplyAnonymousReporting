import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';

/**
 * Hook for debounced search functionality
 *
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @param onDebouncedChange - Callback fired after delay ms of no changes
 * @returns Object containing searchValue, setSearchValue, and isSearching state
 *
 * @example
 * ```ts
 * const { searchValue, setSearchValue, isSearching } = useSearch('', 250, (query) => {
 *   fetchUsers(query);
 * });
 * ```
 */
export function useSearch(
  initialValue: string,
  delay: number,
  onDebouncedChange: (value: string) => void
) {
  const [searchValue, setSearchValueRaw] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onDebouncedChange);
  // Tracks whether the user has explicitly called setSearchValue at least once.
  // This is more reliable than isFirstRenderRef, which breaks under React StrictMode
  // because StrictMode intentionally runs effects twice (mount → cleanup → remount),
  // causing the ref guard to be consumed on the discarded first run.
  const hasInteractedRef = useRef(false);

  // Update callback ref synchronously before effects run
  // This avoids triggering the debounce effect just from callback changes
  useLayoutEffect(() => {
    callbackRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    // Only start debouncing after the user has explicitly changed the value
    if (!hasInteractedRef.current) return;

    // Set searching to true while waiting for debounce
    setIsSearching(true);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced change
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(searchValue);
      setIsSearching(false);
      timeoutRef.current = null;
    }, delay);

    // Cleanup timeout on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [searchValue, delay]);

  const setSearchValue = useCallback((value: string) => {
    hasInteractedRef.current = true;
    setSearchValueRaw(value);
  }, []);

  return {
    searchValue,
    setSearchValue,
    isSearching,
  };
}
