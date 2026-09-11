export interface WinkRound {
  readonly roundId: string;
  readonly startedAtMs: number;
}

export interface WinkLifecycleHandlers {
  onPause?: () => void;
  onResume?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onLocale?: (locale: string) => void;
}

export interface WinkCapabilities {
  getLeaderboard: boolean;
  submitScore: boolean;
  complete: boolean;
}

export interface WinkPlayer {
  id?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

export interface LeaderboardEntry {
  id?: string;
  userId?: string | null;
  isAnonymous?: boolean;
  displayName?: string | null;
  score: number;
  playTime?: number | null;
  gameMode?: string | null;
  counter?: number | null;
  metadata?: Record<string, unknown> | null;
  rank?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  total: number;
}

export interface PersonalBestResponse {
  me: LeaderboardEntry | null;
}

export interface SubmitScoreInput {
  score: number;
  playTime?: number;
  gameMode?: string;
  counter?: number;
  metadata?: Record<string, unknown>;
}

export interface SubmitScoreResponse {
  entry?: LeaderboardEntry;
  isNewBest?: boolean;
  previousBest?: number | null;
  duplicate?: boolean;
  [key: string]: unknown;
}

export interface WinkIntegrationState {
  phase: 'booting' | 'ready_anonymous' | 'ready_authenticated';
  status: string;
  locale: string;
  player: WinkPlayer | null;
  capabilities: WinkCapabilities;
  lifecycle: { paused: boolean; muted: boolean };
  error: { code: string } | null;
}

interface WinkSdk {
  readonly player: WinkPlayer | null;
  readonly locale: string;
  readonly muted: boolean;
  readonly status: string;
  can(capability: string): boolean;
  gameplayStart(): void;
  gameplayStop(): void;
  submitScore(input: number | SubmitScoreInput): Promise<SubmitScoreResponse>;
  getLeaderboard(options?: { limit?: number; offset?: number }): Promise<LeaderboardResponse>;
  getPersonalBest(): Promise<PersonalBestResponse>;
  on(event: 'pause' | 'resume' | 'mute' | 'unmute', listener: () => void): () => void;
  on(event: 'locale', listener: (locale: string) => void): () => void;
  destroy(): void;
}

declare global {
  interface Window {
    Wink?: { init(): Promise<WinkSdk> };
  }
}

const EMPTY_CAPABILITIES: WinkCapabilities = Object.freeze({
  getLeaderboard: false,
  submitScore: false,
  complete: false,
});

function capabilityError(capability: string): Error & { code: string } {
  return Object.assign(new Error(`Wink capability is unavailable: ${capability}`), {
    code: 'CAPABILITY_DENIED',
  });
}

function errorCode(error: unknown): string {
  return error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : 'UNKNOWN';
}

function newRoundId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const random = Math.random().toString(16).slice(2, 10);
  return `round-${Date.now().toString(16)}-${random}`;
}

function normalizeScoreInput(input: SubmitScoreInput): SubmitScoreInput {
  return {
    ...input,
    score: Math.max(0, Math.floor(Number(input.score) || 0)),
    ...(input.playTime === undefined
      ? {}
      : { playTime: Math.max(0, Math.floor(Number(input.playTime) || 0)) }),
    ...(input.counter === undefined
      ? {}
      : { counter: Math.max(0, Math.floor(Number(input.counter) || 0)) }),
  };
}

export class WinkGameIntegration {
  #sdk: WinkSdk | null = null;
  #ready: Promise<WinkSdk | null>;
  #destroyed = false;
  #completedRounds = new Set<string>();
  #scoreAttemptedRounds = new Set<string>();
  #activeRoundId: string | null = null;
  #disposers: Array<() => void> = [];
  #observers = new Set<(state: WinkIntegrationState) => void>();
  #cachedPersonalBest: LeaderboardEntry | null = null;
  #state: WinkIntegrationState = {
    phase: 'booting',
    status: 'connecting',
    locale: 'en',
    player: null,
    capabilities: { ...EMPTY_CAPABILITIES },
    lifecycle: { paused: false, muted: false },
    error: null,
  };

  constructor() {
    this.#ready = this.#initialize();
    void this.#ready.then((sdk) => {
      if (sdk?.can('getLeaderboard')) void this.getPersonalBest();
    });
  }

  async #initialize(): Promise<WinkSdk | null> {
    const sdkLoader = globalThis.window?.Wink;
    if (!sdkLoader?.init) {
      this.#setStandalone('SDK_UNAVAILABLE');
      return null;
    }

    try {
      const sdk = await sdkLoader.init();
      if (this.#destroyed) {
        sdk.destroy?.();
        return null;
      }
      this.#sdk = sdk;
      this.#state = this.#readSdkState();
      this.#subscribeToSdkEvents();
      this.#notify();
      return sdk;
    } catch (error) {
      console.warn('[Wink SDK] init failed', errorCode(error));
      this.#setStandalone(errorCode(error));
      return null;
    }
  }

  #readSdkState(): WinkIntegrationState {
    const sdk = this.#sdk;
    const status = sdk?.status || 'standalone';
    const capabilities: WinkCapabilities = {
      getLeaderboard: Boolean(sdk?.can('getLeaderboard')),
      submitScore: Boolean(sdk?.can('submitScore')),
      complete: Boolean(sdk?.can('complete')),
    };
    const authenticated = Boolean(sdk?.player && capabilities.submitScore);
    return {
      ...this.#state,
      phase: status === 'connecting'
        ? 'booting'
        : authenticated
          ? 'ready_authenticated'
          : 'ready_anonymous',
      status,
      locale: sdk?.locale || this.#state.locale || 'en',
      player: sdk?.player || null,
      capabilities,
      lifecycle: { ...this.#state.lifecycle, muted: Boolean(sdk?.muted) },
      error: null,
    };
  }

  #setStandalone(code: string): void {
    this.#state = {
      ...this.#state,
      phase: 'ready_anonymous',
      status: 'standalone',
      error: { code },
    };
    this.#notify();
  }

  #subscribeToSdkEvents(): void {
    const sdk = this.#sdk;
    if (!sdk) return;
    const register = (event: 'pause' | 'resume' | 'mute' | 'unmute', listener: () => void) => {
      try {
        this.#disposers.push(sdk.on(event, listener));
      } catch (error) {
        console.warn(`[Wink SDK] ${event} listener failed`, errorCode(error));
      }
    };
    register('pause', () => {
      this.#state.lifecycle.paused = true;
      this.#notify();
    });
    register('resume', () => {
      this.#state.lifecycle.paused = false;
      this.#notify();
    });
    register('mute', () => {
      this.#state.lifecycle.muted = true;
      this.#notify();
    });
    register('unmute', () => {
      this.#state.lifecycle.muted = false;
      this.#notify();
    });
    try {
      this.#disposers.push(sdk.on('locale', (locale) => {
        this.#state.locale = String(locale || sdk.locale || 'en');
        this.#notify();
      }));
    } catch (error) {
      console.warn('[Wink SDK] locale listener failed', errorCode(error));
    }
  }

  #notify(): void {
    for (const observer of this.#observers) {
      try {
        observer(this.#state);
      } catch (error) {
        console.warn('[Wink SDK] state observer failed', errorCode(error));
      }
    }
  }

  startRound(): WinkRound {
    const round = Object.freeze({ roundId: newRoundId(), startedAtMs: Date.now() });
    this.#activeRoundId = round.roundId;
    void this.#ready.then((sdk) => sdk?.gameplayStart());
    return round;
  }

  completeRound(
    round: WinkRound,
    _details: { playDurationMs?: number; metadata?: Record<string, unknown> } = {},
  ): boolean {
    if (!round?.roundId || this.#completedRounds.has(round.roundId)) return false;
    this.#completedRounds.add(round.roundId);
    void this.#ready.then((sdk) => sdk?.gameplayStop());
    return true;
  }

  async submitFinalScore(input: SubmitScoreInput): Promise<SubmitScoreResponse> {
    const roundId = this.#activeRoundId;
    if (roundId && this.#scoreAttemptedRounds.has(roundId)) return { duplicate: true };
    if (roundId) this.#scoreAttemptedRounds.add(roundId);
    const sdk = await this.#ready;
    if (!sdk?.can('submitScore')) throw capabilityError('submitScore');
    try {
      const result = await sdk.submitScore(normalizeScoreInput(input));
      if (result?.entry) this.#cachedPersonalBest = result.entry;
      return result;
    } catch (error) {
      console.warn('[Wink SDK] score submission failed', errorCode(error));
      throw error;
    }
  }

  async refreshLeaderboard(options: { limit?: number; offset?: number } = {}): Promise<LeaderboardResponse> {
    const sdk = await this.#ready;
    if (!sdk?.can('getLeaderboard')) return { entries: [], me: null, total: 0 };
    try {
      const result = await sdk.getLeaderboard(options);
      if (result?.me) this.#cachedPersonalBest = result.me;
      return result || { entries: [], me: null, total: 0 };
    } catch (error) {
      console.warn('[Wink SDK] leaderboard unavailable', errorCode(error));
      return { entries: [], me: null, total: 0 };
    }
  }

  async getPersonalBest(): Promise<PersonalBestResponse> {
    const sdk = await this.#ready;
    if (!sdk?.getPersonalBest) return { me: null };
    try {
      const result = await sdk.getPersonalBest();
      if (result?.me) this.#cachedPersonalBest = result.me;
      return result || { me: null };
    } catch (error) {
      console.warn('[Wink SDK] personal best unavailable', errorCode(error));
      return { me: null };
    }
  }

  get personalBest(): LeaderboardEntry | null { return this.#cachedPersonalBest; }
  get capabilities(): WinkCapabilities { return this.#state.capabilities; }
  get state(): WinkIntegrationState { return this.#state; }
  get canSubmitScore(): boolean { return this.capabilities.submitScore; }
  get isReady(): boolean { return this.#state.phase !== 'booting'; }
  get isAuthenticated(): boolean { return this.#state.phase === 'ready_authenticated'; }

  observe(listener: (state: WinkIntegrationState) => void): () => void {
    this.#observers.add(listener);
    listener(this.#state);
    const stop = () => this.#observers.delete(listener);
    this.#disposers.push(stop);
    return stop;
  }

  bindLifecycle(handlers: WinkLifecycleHandlers): () => void {
    let active = true;
    const stops: Array<() => void> = [];
    void this.#ready.then((sdk) => {
      if (!active || !sdk) return;
      if (handlers.onPause) stops.push(sdk.on('pause', handlers.onPause));
      if (handlers.onResume) stops.push(sdk.on('resume', handlers.onResume));
      if (handlers.onMute) stops.push(sdk.on('mute', handlers.onMute));
      if (handlers.onUnmute) stops.push(sdk.on('unmute', handlers.onUnmute));
      if (handlers.onLocale) stops.push(sdk.on('locale', handlers.onLocale));
      if (sdk.muted) handlers.onMute?.();
      else handlers.onUnmute?.();
      handlers.onLocale?.(sdk.locale);
    });
    const stopAll = () => {
      active = false;
      for (const stop of stops.splice(0)) stop();
    };
    this.#disposers.push(stopAll);
    return stopAll;
  }

  dispose(): void {
    this.#destroyed = true;
    for (const stop of this.#disposers.splice(0)) stop();
    this.#observers.clear();
    this.#completedRounds.clear();
    this.#scoreAttemptedRounds.clear();
    this.#activeRoundId = null;
    this.#sdk?.destroy();
    this.#sdk = null;
  }
}

export const winkGame = new WinkGameIntegration();

const hot = (import.meta as ImportMeta & {
  hot?: { dispose(callback: () => void): void };
}).hot;
if (hot) hot.dispose(() => winkGame.dispose());
