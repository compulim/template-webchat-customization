import Observable, { type SubscriptionObserver, type Subscription } from './Observable';

export default function shareObservable<T>(observable: Observable<T>) {
  const observers: SubscriptionObserver<T>[] = [];
  let subscription: Subscription | undefined;

  return new Observable<T>((observer: SubscriptionObserver<T>) => {
    observers.push(observer);

    if (!subscription) {
      subscription = observable.subscribe({
        complete: () => observers.forEach(observer => observer.complete()),
        error: err => observers.forEach(observer => observer.error(err)),
        next: value => observers.forEach(observer => observer.next(value))
      });
    }

    return () => {
      const index = observers.indexOf(observer);

      ~index && observers.splice(index, 1);

      if (!observers.length) {
        subscription?.unsubscribe();
        subscription = undefined;
      }
    };
  });
}
