"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useStableCallback = useStableCallback;
var _safeReact = require("./safeReact");
var _useRefWithInit = require("./useRefWithInit");
const useInsertionEffect = _safeReact.SafeReact.useInsertionEffect;
const useSafeInsertionEffect =
// React 17 doesn't have useInsertionEffect.
useInsertionEffect &&
// Preact replaces useInsertionEffect with useLayoutEffect and fires too late.
useInsertionEffect !== _safeReact.SafeReact.useLayoutEffect ? useInsertionEffect : fn => fn();
/**
 * Stabilizes the function passed so it's always the same between renders.
 *
 * The function becomes non-reactive to any values it captures.
 * It can safely be passed as a dependency of `React.useMemo` and `React.useEffect` without re-triggering them if its captured values change.
 *
 * The function must only be called inside effects and event handlers, never during render (which throws an error).
 *
 * This hook is a more permissive version of React 19.2's `React.useEffectEvent` in that it can be passed through contexts and called in event handler props, not just effects.
 */
function useStableCallback(callback) {
  const stable = (0, _useRefWithInit.useRefWithInit)(createStableCallback).current;
  stable.next = callback;
  useSafeInsertionEffect(stable.effect);
  return stable.trampoline;
}
function createStableCallback() {
  const stable = {
    next: undefined,
    callback: assertNotCalled,
    trampoline: (...args) => stable.callback?.(...args),
    effect: () => {
      stable.callback = stable.next;
    }
  };
  return stable;
}
function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    // TODO: fix mui/no-guarded-throw
    // eslint-disable-next-line mui/no-guarded-throw
    throw /* minify-error-disabled */new Error('Base UI: Cannot call an event handler while rendering.');
  }
}