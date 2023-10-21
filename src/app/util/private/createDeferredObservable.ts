import Observable, { type SubscriptionObserver, type SubscriberFunction } from './Observable';

function removeInline<T>(array: T[], searchElement: T) {
  const index = array.indexOf(searchElement);

  ~index && array.splice(index, 1);
}

export default function createDeferredObservable<T>(
  subscribe: SubscriberFunction<T>
): SubscriptionObserver<T> & { observable: Observable<T> } {
  const observers: SubscriptionObserver<T>[] = [];
  const observable = new Observable<T>(observer => {
    const subscription = subscribe?.(observer);

    observers.push(observer);

    return () => {
      removeInline(observers, observer);

      typeof subscription === 'function' ? subscription() : subscription?.unsubscribe();
    };
  });

  return {
    get closed() {
      return false;
    },
    complete: () => observers.forEach(observer => observer.complete()),
    error: error => observers.forEach(observer => observer.error(error)),
    next: value => observers.forEach(observer => observer.next(value)),
    observable
  };
}
