export function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, message = "Request timed out"): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  const promise = Promise.resolve(promiseLike).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  return Promise.race([promise, timeoutPromise]);
}

export function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export function isCancelError(err: unknown) {
  return err instanceof Error && err.message === "CANCELLED";
}
