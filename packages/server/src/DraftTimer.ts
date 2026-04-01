export interface DraftTimerCallbacks {
  onTick: (remaining: number) => void;
  onExpire: () => void;
}

/**
 * Server-side countdown timer for a draft step.
 * Ticks every second and calls onExpire when it reaches 0.
 */
export class DraftTimer {
  private remaining: number;
  private interval: ReturnType<typeof setInterval> | null = null;
  private callbacks: DraftTimerCallbacks;

  constructor(seconds: number, callbacks: DraftTimerCallbacks) {
    this.remaining = seconds;
    this.callbacks = callbacks;
  }

  start(): void {
    this.stop();

    this.interval = setInterval(() => {
      this.remaining--;
      this.callbacks.onTick(this.remaining);

      if (this.remaining <= 0) {
        this.stop();
        this.callbacks.onExpire();
      }
    }, 1_000);
  }

  stop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getRemaining(): number {
    return this.remaining;
  }
}
