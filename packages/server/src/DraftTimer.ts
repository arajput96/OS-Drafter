export interface DraftTimerCallbacks {
  onTick: (remaining: number) => void;
  onExpire: () => void;
}

/** Grace period after the visible timer hits 0 before the step is forced to
 *  expire. Players who lock in at the very last second still have their action
 *  accepted within this window. */
const EXPIRY_GRACE_MS = 1_000;

/**
 * Server-side countdown timer for a draft step.
 * Ticks every second; fires onExpire one grace second after hitting 0 so
 * last-moment lock-ins have a chance to register.
 */
export class DraftTimer {
  private readonly initialSeconds: number;
  private remaining: number;
  private interval: ReturnType<typeof setInterval> | null = null;
  private graceTimeout: ReturnType<typeof setTimeout> | null = null;
  private callbacks: DraftTimerCallbacks;

  constructor(seconds: number, callbacks: DraftTimerCallbacks) {
    this.initialSeconds = Math.max(1, seconds);
    this.remaining = this.initialSeconds;
    this.callbacks = callbacks;
  }

  start(): void {
    this.stop();
    this.remaining = this.initialSeconds;

    this.interval = setInterval(() => {
      this.remaining--;
      this.callbacks.onTick(this.remaining);

      if (this.remaining <= 0) {
        if (this.interval !== null) {
          clearInterval(this.interval);
          this.interval = null;
        }
        this.graceTimeout = setTimeout(() => {
          this.graceTimeout = null;
          this.callbacks.onExpire();
        }, EXPIRY_GRACE_MS);
      }
    }, 1_000);
  }

  stop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.graceTimeout !== null) {
      clearTimeout(this.graceTimeout);
      this.graceTimeout = null;
    }
  }

  getRemaining(): number {
    return this.remaining;
  }
}
