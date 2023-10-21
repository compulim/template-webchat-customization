import { type Dispatch, type SetStateAction, useCallback, useRef, useEffect } from 'react';
import { useRefFrom } from 'use-ref-from';
import { useStateWithRef } from 'use-state-with-ref';

type DebounceInit = {
  interval?: number;
};

const DEFAULT_DEBOUNCE_INTERVAL = 100;

export default function useStateWithDebounce<T>(
  initialState: (() => T) | T,
  onDebounce?: ((value: T) => void) | undefined,
  { interval }: DebounceInit = {}
): readonly [T, Dispatch<SetStateAction<T>>, Dispatch<SetStateAction<T>>] {
  const [value, setValue, valueRef] = useStateWithRef<T>(initialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const intervalRef = useRefFrom(interval || DEFAULT_DEBOUNCE_INTERVAL);
  const onDebounceRef = useRefFrom(onDebounce);

  const setValueWithDebounce = useCallback<Dispatch<SetStateAction<T>>>(
    (value: SetStateAction<T>) => {
      setValue(value);

      debounceRef.current && clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(
        () => {
          onDebounceRef.current?.(valueRef.current);
        },
        Math.max(intervalRef.current, 10)
      );
    },
    [debounceRef, intervalRef, onDebounceRef]
  );

  const setValueNow = useCallback<Dispatch<SetStateAction<T>>>(
    (value: SetStateAction<T>) => {
      debounceRef.current && clearTimeout(debounceRef.current);

      setValue(value);

      onDebounceRef.current?.(valueRef.current);
    },
    [debounceRef, onDebounceRef, setValue]
  );

  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), [debounceRef]);

  return Object.freeze([value, setValueWithDebounce, setValueNow] as const);
}
