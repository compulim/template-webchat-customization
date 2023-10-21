import './ActivityInput.css';

import { ChangeEventHandler, memo, useCallback } from 'react';
import { useRefFrom } from 'use-ref-from';

import onErrorResumeNext from '../util/onErrorResumeNext';

type Props = {
  onChange: (value: string) => void;
  value: string;
};

export default memo(function ActivityInput({ onChange, value }: Props) {
  const onChangeRef = useRefFrom(onChange);

  const handleBlur = useCallback(
    () => onErrorResumeNext(() => onChangeRef.current(JSON.stringify(JSON.parse(value), null, 2))),
    [onChangeRef]
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    ({ currentTarget: { value } }) => onChangeRef.current?.(value),
    [onChangeRef]
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
