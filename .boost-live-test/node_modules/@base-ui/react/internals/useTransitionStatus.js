"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTransitionStatus = useTransitionStatus;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
 * @param deferEndingState - a boolean that delays the `'ending'` state by a frame
 * @param animateInitialOpen - a boolean that makes an element which mounts already open still go
 *   through `'starting'`. Off by default so content that was open on the first render (a
 *   `defaultOpen` popup on page load, SSR'd markup) doesn't animate in.
 */
function useTransitionStatus(open, enableIdleState = false, deferEndingState = false, animateInitialOpen = false) {
  const [transitionStatus, setTransitionStatus] = React.useState(open && enableIdleState ? 'idle' : undefined);
  // Starting at `false` while open lets the `open && !mounted` branch below run on the first
  // render, which is what produces the `'starting'` phase. React re-renders before committing, so
  // the element is still mounted in the same pass.
  const [mounted, setMounted] = React.useState(open && !animateInitialOpen);
  if (open && !mounted) {
    setMounted(true);
    setTransitionStatus('starting');
  }
  if (!open && mounted && transitionStatus !== 'ending' && !deferEndingState) {
    setTransitionStatus('ending');
  }
  if (!open && !mounted && transitionStatus === 'ending') {
    setTransitionStatus(undefined);
  }
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open && mounted && transitionStatus !== 'ending' && deferEndingState) {
      const frame = _useAnimationFrame.AnimationFrame.request(() => {
        setTransitionStatus('ending');
      });
      return () => {
        _useAnimationFrame.AnimationFrame.cancel(frame);
      };
    }
    return undefined;
  }, [open, mounted, transitionStatus, deferEndingState]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open || enableIdleState) {
      return undefined;
    }
    const frame = _useAnimationFrame.AnimationFrame.request(() => {
      // Avoid `flushSync` here due to Firefox.
      // See https://github.com/mui/base-ui/pull/3424
      setTransitionStatus(undefined);
    });
    return () => {
      _useAnimationFrame.AnimationFrame.cancel(frame);
    };
  }, [enableIdleState, open]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open || !enableIdleState) {
      return undefined;
    }
    if (open && mounted && transitionStatus !== 'idle') {
      setTransitionStatus('starting');
    }
    const frame = _useAnimationFrame.AnimationFrame.request(() => {
      setTransitionStatus('idle');
    });
    return () => {
      _useAnimationFrame.AnimationFrame.cancel(frame);
    };
  }, [enableIdleState, open, mounted, transitionStatus]);
  return {
    mounted,
    setMounted,
    transitionStatus
  };
}