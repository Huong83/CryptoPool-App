// Prevent the live-market updater from observing its own text updates forever.
// React mutations on the table/card containers are still observed so route changes work.
(() => {
  const NativeMO = window.MutationObserver;
  if (!NativeMO || NativeMO.__cpSafePatched) return;
  class SafeMutationObserver extends NativeMO {
    constructor(callback) {
      super((records, observer) => {
        const filtered = records.filter(r => {
          const el = r.target instanceof Element ? r.target : null;
          return !(el && el.closest && el.closest('.market-row:not(.header), .asset-card'));
        });
        if (filtered.length) callback(filtered, observer);
      });
    }
  }
  SafeMutationObserver.__cpSafePatched = true;
  window.MutationObserver = SafeMutationObserver;
})();
