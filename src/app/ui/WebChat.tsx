import './WebChat.css';

import { Components, createStore } from 'botframework-webchat';
import { memo, useEffect, useMemo, useState } from 'react';
import { type WebChatActivity } from 'botframework-webchat-core';

import createDirectLineEmulator from '../util/createDirectLineEmulator';

const { BasicWebChat, Composer } = Components;

type Props = Readonly<{ activities: readonly WebChatActivity[] }>;

export default memo(function Chat({ activities }: Props) {
  const [ready, setReady] = useState(false);
  const store = useMemo(
    () =>
      createStore({}, () => (next: (action: unknown) => unknown) => (action: { type: string }) => {
        if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
          setReady(true);
        }

        return next(action);
      }),
    [setReady]
  );

  const { directLine } = useMemo(() => createDirectLineEmulator({ store }), [store]);

  useEffect(() => {
    activities && ready && activities.forEach(activity => directLine.emulateIncomingActivity(activity));
  }, [activities, directLine, ready]);

  useEffect(() => {
    const abortController = new AbortController();

    (async function () {
      const { signal } = abortController;

      for (; !signal.aborted; ) {
        const { resolveAll } = await directLine.actPostActivity(() => {});

        if (signal.aborted) {
          break;
        }

        const echoBackActivity = await resolveAll();

        console.log(echoBackActivity);
      }
    })();

    return () => abortController.abort();
  }, [directLine]);

  return (
    <div className="chat">
      <Composer directLine={directLine} store={store}>
        <BasicWebChat />
      </Composer>
    </div>
  );
});
