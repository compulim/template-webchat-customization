export default function signalToReject(signal: AbortSignal): Promise<never> {
  return new Promise(
    (_, reject) => signal && signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
  );
}
