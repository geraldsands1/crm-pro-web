import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stopped changing for `delayMs`.
 *
 * A search box stays fully controlled and responsive — every keystroke
 * updates the input immediately — while the debounced copy feeds the
 * query key, so work happens once the user pauses rather than on every
 * character.
 *
 * The cleanup is what makes it work: each change cancels the previous
 * timer, so only the final pause in a burst of typing survives to fire.
 *
 * RC2.4C: promoted out of the customers feature to `src/hooks`, since
 * agents needed the identical behaviour and one feature importing
 * another's internals is how feature boundaries quietly dissolve.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
