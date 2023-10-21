import './ActivityInput.css';

import { type ChangeEventHandler, memo, useCallback, useMemo, KeyboardEventHandler, useRef } from 'react';
import { useRefFrom } from 'use-ref-from';

import onErrorResumeNext from '../util/onErrorResumeNext';
import useStateWithDebounce from './hooks/useStateWithDebounce';

type Props = {
  onChange: (value: string) => void;
  value: string;
};

export default memo(function ActivityInput({ onChange, value: valueFromProps }: Props) {
  const [value, setValue, setValueNow] = useStateWithDebounce(valueFromProps, onChange, { interval: 300 });
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRefFrom(value);

  useMemo(() => value === valueFromProps || setValueNow(valueFromProps), [valueFromProps, setValueNow]);

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    ({ currentTarget: { value } }) => setValue(value),
    [setValue]
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLTextAreaElement>>(
    event => {
      if (event.altKey && event.shiftKey && (event.key === 'f' || event.key === 'F')) {
        const prettyValue = onErrorResumeNext(() => JSON.stringify(JSON.parse(valueRef.current), null, 2));

        if (prettyValue) {
          const { current } = elementRef;

          if (current) {
            const selectionStart = current?.selectionStart || Infinity;

            current.value = prettyValue;
            current.selectionEnd = current.selectionStart = selectionStart;
          }

          setValueNow(prettyValue);
        }
      }
    },
    [elementRef, setValueNow, valueRef]
  );

  return (
    <textarea
      autoCapitalize="false"
      autoComplete="false"
      autoCorrect="false"
      autoFocus={true}
      className="activity-input"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      ref={elementRef}
      spellCheck={false}
      value={value}
    />
  );
});
