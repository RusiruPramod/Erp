import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (ms). Useful for search inputs
 * so queries don't fire on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

