type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface IdleDeadline {
  timeRemaining: () => number;
  readonly didTimeout: boolean;
}

interface IdleRequestCallbackOptions {
  timeout?: number;
}

interface Window {
  requestIdleCallback: (
    callback: IdleRequestCallback,
    options?: IdleRequestCallbackOptions
  ) => number;
  cancelIdleCallback: (handle: number) => void;
}
