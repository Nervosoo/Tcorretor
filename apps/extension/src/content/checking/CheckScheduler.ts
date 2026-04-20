export class CheckScheduler {
  private timerId: number | undefined;
  private controller: AbortController | undefined;

  constructor(private readonly delayMs = 600) {}

  schedule(task: (signal: AbortSignal) => Promise<void>, delayMs = this.delayMs) {
    this.cancel();
    this.controller = new AbortController();

    this.timerId = window.setTimeout(() => {
      void task(this.controller!.signal);
    }, delayMs);
  }

  flush(task: (signal: AbortSignal) => Promise<void>) {
    this.schedule(task, 0);
  }

  cancel() {
    if (typeof this.timerId !== "undefined") {
      window.clearTimeout(this.timerId);
      this.timerId = undefined;
    }

    this.controller?.abort();
    this.controller = undefined;
  }
}
