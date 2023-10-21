import createDeferred from 'p-defer';
import Observable from './private/Observable';
import random from 'math-random';
// @ts-expect-error missing typings
import updateIn from 'simple-update-in';

import became from './private/became';
import createDeferredObservable from './private/createDeferredObservable';
import shareObservable from './private/shareObservable';

import { type createStore } from 'botframework-webchat';
import { type WebChatActivity } from 'botframework-webchat-core';

type ActPostActivityInit = { id?: string | undefined };
type Deferred<T> = ReturnType<typeof createDeferred<T>>;
type WebChatStore = ReturnType<typeof createStore>;

type PostActivityCallResult = {
  outgoingActivity: WebChatActivity;
  returnPostActivityDeferred: Deferred<string>;
};

type ActivityUpdater = (activity: WebChatActivity) => WebChatActivity;

function isNativeClock() {
  return ('' + setTimeout).endsWith('() { [native code] }');
}

function uniqueId() {
  return random().toString(36).substring(2, 7);
}

export default function createDirectLineEmulator({
  autoConnect = true,
  store
}: {
  autoConnect?: boolean | undefined;
  store: WebChatStore;
}) {
  if (!isNativeClock()) {
    throw new Error('Fake timer is detected at global-level. You must pass it via the "ponyfill" option.');
  }

  const now = Date.now();
  const getTimestamp = () => new Date().toISOString();

  const connectedDeferred = createDeferred();
  const connectionStatusDeferredObservable = createDeferredObservable<number>(() => {
    connectionStatusDeferredObservable.next(0);
  });
  const activityDeferredObservable = createDeferredObservable(() => {
    (async function () {
      connectionStatusDeferredObservable.next(1);

      await connectedDeferred.promise;
      connectionStatusDeferredObservable.next(2);
    })();
  });

  const postActivityCallDeferreds: Deferred<PostActivityCallResult>[] = [];
  const postActivity = (outgoingActivity: WebChatActivity) => {
    const returnPostActivityDeferred = createDeferred<string>();

    const deferred = postActivityCallDeferreds.shift();

    if (!deferred) {
      throw new Error(
        'When DirectLineEmulator is installed, you must call actPostActivity() before sending a message.'
      );
    }

    deferred.resolve({ outgoingActivity, returnPostActivityDeferred });

    return new Observable(observer => {
      (async function () {
        try {
          observer.next(await returnPostActivityDeferred.promise);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  };

  const actPostActivity = async (fn: () => Promise<void> | void, { id: idFromOptions }: ActPostActivityInit = {}) => {
    const postActivityCallDeferred = createDeferred<PostActivityCallResult>();

    postActivityCallDeferreds.push(postActivityCallDeferred);

    await fn();

    const { outgoingActivity, returnPostActivityDeferred } = await postActivityCallDeferred.promise;
    const id = idFromOptions || uniqueId();

    let echoBackActivity: WebChatActivity = { ...outgoingActivity, id, timestamp: getTimestamp() };

    const echoBack = async (updater?: ActivityUpdater) => {
      if (typeof updater === 'function') {
        echoBackActivity = updater(echoBackActivity);
      }

      activityDeferredObservable.next(echoBackActivity);

      await became(
        'echo back activity appears in the store',
        () => store.getState().activities.find((activity: WebChatActivity) => activity.id === echoBackActivity.id),
        1000
      );
    };

    const rejectPostActivity = (error: Error) => returnPostActivityDeferred.reject(error);
    const resolvePostActivity = () => {
      returnPostActivityDeferred.resolve(id);

      return echoBackActivity;
    };

    const resolveAll = async (updater?: ActivityUpdater) => {
      await echoBack(updater);
      return resolvePostActivity();
    };

    return { activity: outgoingActivity, echoBack, rejectPostActivity, resolveAll, resolvePostActivity };
  };

  autoConnect && connectedDeferred.resolve();

  const directLine = {
    activity$: shareObservable(activityDeferredObservable.observable),
    actPostActivity,
    connectionStatus$: shareObservable(connectionStatusDeferredObservable.observable),
    end: () => {
      // This is a mock and will no-op on dispatch().
    },
    postActivity,
    emulateReconnect: () => {
      connectionStatusDeferredObservable.next(1);

      return {
        resolve: () => connectionStatusDeferredObservable.next(2)
      };
    },
    emulateConnected: connectedDeferred.resolve,
    emulateIncomingActivity: async (activity: Partial<WebChatActivity>) => {
      if (typeof activity === 'string') {
        activity = {
          from: { id: 'bot', role: 'bot' },
          id: uniqueId(),
          text: activity,
          timestamp: getTimestamp(),
          type: 'message'
        };
      } else {
        activity = updateIn(activity, ['from', 'role'], (role: WebChatActivity['from']['role']) => role || 'bot');
        activity = updateIn(activity, ['id'], (id: WebChatActivity['id']) => id || uniqueId());
        activity = updateIn(activity, ['timestamp'], (timestamp: number | string | undefined) =>
          typeof timestamp === 'number'
            ? new Date(now + timestamp).toISOString()
            : typeof timestamp === 'undefined'
            ? getTimestamp()
            : timestamp
        );
        activity = updateIn(activity, ['type'], (type: WebChatActivity['type']) => type || 'message');
      }

      const { id } = activity;

      activityDeferredObservable.next(activity);

      await became(
        'incoming activity appears in the store',
        () => store.getState().activities.find((activity: WebChatActivity) => activity.id === id),
        1000
      );
    },
    emulateOutgoingActivity: (activity: string | Partial<WebChatActivity>, options: ActPostActivityInit) => {
      if (typeof activity === 'string') {
        activity = {
          from: { id: 'user', role: 'user' },
          text: activity,
          type: 'message'
        };
      }

      return actPostActivity(() => {
        store.dispatch({
          meta: { method: 'code' },
          payload: { activity },
          type: 'DIRECT_LINE/POST_ACTIVITY'
        });
      }, options);
    }
  };

  return { directLine, store };
}
