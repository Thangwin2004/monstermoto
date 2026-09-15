(() => {
  const splash = document.getElementById("papa-studio-splash");
  if (!splash) return;

  const startedAt = window.performance.now();
  let dismissalScheduled = false;

  const doDismiss = () => {
    if (dismissalScheduled) return;
    dismissalScheduled = true;

    // Minimum 1200ms duration so fast devices see the logo smoothly without sudden flash
    const minimumDuration = 1200;
    const elapsed = window.performance.now() - startedAt;
    const remainingDuration = Math.max(0, minimumDuration - elapsed);

    window.setTimeout(() => {
      splash.classList.add("is-ready");
      window.setTimeout(() => {
        splash.classList.add("is-hidden");
        window.setTimeout(() => {
          try {
            splash.remove();
          } catch (_) {}
        }, 450);
      }, 160);
    }, remainingDuration);
  };

  // Expose function for the game engine to call when MenuScene is ready
  window.dismissPapaSplash = doDismiss;

  // Fallback timer: in case game initialization hangs or fails, never leave player stuck
  window.setTimeout(doDismiss, 8000);
})();
