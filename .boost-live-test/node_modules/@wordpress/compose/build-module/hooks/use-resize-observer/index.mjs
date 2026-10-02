// packages/compose/src/hooks/use-resize-observer/index.ts
import { useResizeObserver as _useResizeObserver } from "./use-resize-observer.mjs";
import _useLegacyResizeObserver from "./legacy/index.mjs";
function useResizeObserver(callback, options = {}) {
  return callback ? _useResizeObserver(callback, options) : _useLegacyResizeObserver();
}
export {
  useResizeObserver as default
};
//# sourceMappingURL=index.mjs.map
