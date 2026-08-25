import {
  complete,
  getCapabilities,
  getLeaderboard,
  getPersonalBest,
  getState,
  onMute,
  onPause,
  onResume,
  onUnmute,
  submitScore,
  subscribe,
  type CompletionInput,
  type LeaderboardEntry,
  type LeaderboardOptions,
  type LeaderboardResponse,
  type PersonalBestResponse,
  type SubmitScoreInput,
  type SubmitScoreResponse,
  type WinkBridgeCapabilities,
  type WinkBridgeState,
} from './wink-bridge';

export interface WinkRound {
  readonly roundId: string;
  readonly startedAtMs: number;
}

export interface WinkLifecycleHandlers {
  onPause?: () => void;
  onResume?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
}

const DENIED: WinkBridgeCapabilities = Object.freeze({
  getLeaderboard: false,
  submitScore: false,
  complete: false,
});

function newRoundId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }
  const random = Math.random().toString(16).slice(2, 10);
  return `round-${Date.now().toString(16)}-${random}`;
}

export class WinkGameIntegration {
  #completedRounds = new Set<string>();

  #disposers: Array<() => void> = [];

  #cachedPersonalBest: LeaderboardEntry | null = null;

  constructor() {
    this.observe((state) => {
      if (state?.phase === 'ready_authenticated' && !this.#cachedPersonalBest) {
        this.getPersonalBest().catch(() => {});
      }
    });
  }

  startRound(): WinkRound {
    return Object.freeze({
      roundId: newRoundId(),
      startedAtMs: Date.now(),
    });
  }

  completeRound(
    round: WinkRound,
    extra: Omit<CompletionInput, 'roundId' | 'playDurationMs'> & {
      playDurationMs?: number;
    } = {},
  ): boolean {
    if (this.#completedRounds.has(round.roundId)) {
      return false;
    }
    this.#completedRounds.add(round.roundId);

    if (!this.capabilities.complete) return false;

    const { playDurationMs, ...rest } = extra;
    try {
      complete({
        roundId: round.roundId,
        playDurationMs: Math.max(
          0,
          Math.round(playDurationMs ?? Date.now() - round.startedAtMs),
        ),
        ...rest,
      });
    } catch (err) {
      console.warn('[Wink] complete() failed:', (err as any)?.message || err);
    }
    return true;
  }

  async submitFinalScore(input: SubmitScoreInput): Promise<SubmitScoreResponse> {
    const res = await submitScore(input);
    if (res?.entry) {
      this.#cachedPersonalBest = res.entry;
    }
    return res;
  }

  async refreshLeaderboard(
    options?: LeaderboardOptions,
  ): Promise<LeaderboardResponse> {
    const res = await getLeaderboard(options);
    if (res?.me) {
      this.#cachedPersonalBest = res.me;
    }
    return res;
  }

  async getPersonalBest(): Promise<PersonalBestResponse> {
    const res = await getPersonalBest();
    if (res?.me) {
      this.#cachedPersonalBest = res.me;
    }
    return res;
  }

  get personalBest(): LeaderboardEntry | null {
    return this.#cachedPersonalBest;
  }

  get capabilities(): WinkBridgeCapabilities {
    return getCapabilities() ?? DENIED;
  }

  get state(): WinkBridgeState | null {
    return getState();
  }

  get isAuthenticated(): boolean {
    return this.state?.phase === 'ready_authenticated';
  }

  get canSubmitScore(): boolean {
    return this.capabilities.submitScore === true;
  }

  observe(listener: (state: WinkBridgeState) => void): () => void {
    const stop = subscribe(listener);
    this.#disposers.push(stop);
    return stop;
  }

  bindLifecycle(handlers: WinkLifecycleHandlers): () => void {
    const stops: Array<() => void> = [];
    if (handlers.onPause) stops.push(onPause(handlers.onPause));
    if (handlers.onResume) stops.push(onResume(handlers.onResume));
    if (handlers.onMute) stops.push(onMute(handlers.onMute));
    if (handlers.onUnmute) stops.push(onUnmute(handlers.onUnmute));

    const stopAll = () => stops.forEach((stop) => stop());
    this.#disposers.push(stopAll);
    return stopAll;
  }

  dispose(): void {
    this.#disposers.forEach((stop) => stop());
    this.#disposers = [];
    this.#completedRounds.clear();
  }
}

export const winkGame = new WinkGameIntegration();
