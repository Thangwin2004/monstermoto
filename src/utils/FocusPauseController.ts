export interface FocusPauseOptions {
  isRunning?: () => boolean;
  pause: () => void;
  resume: () => void;
  pauseAudio?: () => void | Promise<void>;
  resumeAudio?: () => void | Promise<void>;
}

export interface FocusPauseController {
  pauseFromHost: () => void;
  resumeFromHost: () => void;
  destroy: () => void;
}

export function installFocusPause({
  isRunning = () => true,
  pause,
  resume,
  pauseAudio = () => {},
  resumeAudio = () => {},
}: FocusPauseOptions): FocusPauseController {
  const pauseReasons = new Set<string>();
  let shouldResume = false;
  let destroyed = false;

  const safelyCall = (callback: () => void | Promise<void>): void => {
    try {
      const result = callback();
      if (result instanceof Promise) void result.catch(() => {});
    } catch {
      // Lifecycle pause must never crash the host game.
    }
  };

  const pauseFor = (reason: string): void => {
    if (destroyed || pauseReasons.has(reason)) return;
    const firstReason = pauseReasons.size === 0;
    pauseReasons.add(reason);
    if (!firstReason) return;

    shouldResume = Boolean(isRunning());
    safelyCall(pause);
    safelyCall(pauseAudio);
  };

  const resumeFor = (reason: string): void => {
    if (destroyed || !pauseReasons.delete(reason) || pauseReasons.size > 0)
      return;
    const resumeNow = shouldResume;
    shouldResume = false;
    safelyCall(resumeAudio);
    if (!resumeNow) return;
    safelyCall(resume);
  };

  const handleVisibility = (): void => {
    if (document.visibilityState === "hidden") pauseFor("visibility");
    else resumeFor("visibility");
  };
  const handleBlur = (): void => pauseFor("focus");
  const handleFocus = (): void => resumeFor("focus");
  const handlePageHide = (): void => pauseFor("page");
  const handlePageShow = (): void => resumeFor("page");
  const viewportObserver =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting && entry.intersectionRatio >= 0.15) {
              resumeFor("viewport");
            } else {
              pauseFor("viewport");
            }
          },
          { threshold: [0, 0.15] },
        );

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("blur", handleBlur);
  window.addEventListener("focus", handleFocus);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);
  viewportObserver?.observe(document.documentElement);

  if (document.visibilityState === "hidden") pauseFor("visibility");

  return {
    pauseFromHost: () => pauseFor("host"),
    resumeFromHost: () => resumeFor("host"),
    destroy: () => {
      destroyed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      viewportObserver?.disconnect();
      pauseReasons.clear();
    },
  };
}
