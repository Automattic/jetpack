"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useAnimationsFinished = useAnimationsFinished;
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _resolveRef = require("../utils/resolveRef");
var TransitionStatusDataAttributes = _interopRequireWildcard(require("./TransitionStatusDataAttributes"));
let pendingCallbacks = null;

/**
 * Runs the callback in a synchronous flush before the browser paints, so that the
 * browser doesn't paint an intermediate frame: https://github.com/mui/base-ui/issues/979
 * Callbacks that become ready within the same microtask checkpoint (e.g. multiple elements
 * whose animations finish together) are batched into a single commit:
 * https://github.com/mui/base-ui/issues/5481
 */
function flushBeforePaint(fn) {
  if (!pendingCallbacks) {
    const callbacks = [];
    pendingCallbacks = callbacks;
    queueMicrotask(() => {
      pendingCallbacks = null;
      ReactDOM.flushSync(() => {
        for (const callback of callbacks) {
          callback();
        }
      });
    });
  }
  pendingCallbacks.push(fn);
}

/**
 * Executes a function once all animations have finished on the provided element.
 * If an animation is canceled, waits for any replacement animations before executing.
 * @param elementOrRef - The element to watch for animations.
 * @param waitForStartingStyleRemoved - Whether to wait for [data-starting-style] to be removed before checking for animations.
 * @param batch - Whether completions ready in the same microtask may be coalesced into a single
 * commit. A batched callback runs before earlier callbacks' React updates have committed, so only
 * opt in when the callback doesn't read state that another completion can change.
 * @returns A function that takes a callback to execute once all animations have finished, and an optional AbortSignal to abort the callback
 */
function useAnimationsFinished(elementOrRef, waitForStartingStyleRemoved = false, batch = false) {
  const frame = (0, _useAnimationFrame.useAnimationFrame)();
  return (0, _useStableCallback.useStableCallback)((fnToExecute,
  /**
   * An optional [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that
   * can be used to abort `fnToExecute` before all the animations have finished.
   * @default null
   */
  signal = null) => {
    frame.cancel();
    const element = (0, _resolveRef.resolveRef)(elementOrRef);
    if (element == null) {
      return;
    }
    const resolvedElement = element;
    const done = () => {
      if (!batch) {
        // Synchronously flush the unmounting of the component so that the browser doesn't
        // paint: https://github.com/mui/base-ui/issues/979
        // Each callback gets its own commit so that later completions observe the React
        // updates caused by earlier ones.
        ReactDOM.flushSync(fnToExecute);
        return;
      }
      flushBeforePaint(() => {
        // Re-check at flush time: the signal may abort between queueing and the flush.
        if (!signal?.aborted) {
          fnToExecute();
        }
      });
    };
    if (typeof resolvedElement.getAnimations !== 'function' || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
      fnToExecute();
      return;
    }
    function exec() {
      Promise.all(resolvedElement.getAnimations().map(animation => animation.finished)).then(() => {
        if (!signal?.aborted) {
          done();
        }
      }, () => {
        if (signal?.aborted) {
          return;
        }
        const currentAnimations = resolvedElement.getAnimations();
        if (currentAnimations.some(animation => animation.pending || animation.playState !== 'finished')) {
          // Sometimes animations can be aborted because a property they depend on changes while the animation plays.
          // In such cases, we need to re-check if any new animations have started.
          exec();
          return;
        }
        done();
      });
    }
    if (waitForStartingStyleRemoved) {
      const startingStyleAttribute = TransitionStatusDataAttributes.startingStyle;

      // If `[data-starting-style]` isn't present, fall back to waiting one more frame
      // to give "open" animations a chance to be registered.
      if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
        frame.request(exec);
        return;
      }

      // Wait for `[data-starting-style]` to have been removed.
      const attributeObserver = new MutationObserver(() => {
        if (!resolvedElement.hasAttribute(startingStyleAttribute)) {
          attributeObserver.disconnect();
          exec();
        }
      });
      attributeObserver.observe(resolvedElement, {
        attributes: true,
        attributeFilter: [startingStyleAttribute]
      });
      signal?.addEventListener('abort', () => attributeObserver.disconnect(), {
        once: true
      });
      return;
    }
    frame.request(exec);
  });
}