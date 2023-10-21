import './ActivityInput.css';

import { type ChangeEventHandler, memo, useCallback, useMemo } from 'react';
import { useRefFrom } from 'use-ref-from';

import onErrorResumeNext from '../util/onErrorResumeNext';
import useStateWithDebounce from './hooks/useStateWithDebounce';

type Props = {
  onChange: (value: string) => void;
  value: string;
};

export default memo(function ActivityInput({ onChange, value: valueFromProps }: Props) {
  const onChangeRef = useRefFrom(onChange);
  const [value, setValue, setValueNow] = useStateWithDebounce(valueFromProps, onChange);

  const valueRef = useRefFrom(value);

  useMemo(() => value === valueFromProps || setValueNow(valueFromProps), [valueFromProps, setValueNow]);

  const handleBlur = useCallback(
    () => onErrorResumeNext(() => setValueNow(JSON.stringify(JSON.parse(valueRef.current), null, 2))),
    [onChangeRef, setValueNow, valueRef]
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    ({ currentTarget: { value } }) => setValue(value),
    [setValue]
  );

  return (
    <textarea
      autoCapitalize="false"
      autoComplete="false"
      autoCorrect="false"
      autoFocus={true}
      className="activity-input"
      onBlur={handleBlur}
      onChange={handleChange}
      spellCheck={false}
      value={value}
    />
  );
});
