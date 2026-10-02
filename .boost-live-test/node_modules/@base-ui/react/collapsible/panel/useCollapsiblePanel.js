"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCollapsiblePanel = useCollapsiblePanel;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _warn = require("@base-ui/utils/warn");
var _owner = require("@base-ui/utils/owner");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useAnimationsFinished = require("../../internals/useAnimationsFinished");
var CollapsiblePanelDataAttributes = _interopRequireWildcard(require("./CollapsiblePanelDataAttributes"));
const EMPTY_DIMENSIONS = {
  height: undefined,
  width: undefined
};
function useCollapsiblePanel(parameters) {
  const {
    externalRef,
    hiddenUntilFound,
    id: idParam,
    keepMounted,
    mounted,
    onOpenChange,
    open,
    setMounted,
    setOpen,
    transitionStatus
  } = parameters;
  const panelRef = React.useRef(null);
  const animationTypeRef = React.useRef(null);
  const [dimensions, setDimensionsUnwrapped] = React.useState(EMPTY_DIMENSIONS);
  const lastMeasuredDimensionsRef = React.useRef(EMPTY_DIMENSIONS);
  // `beforematch` should reveal the matched content immediately, so the next
  // open cycle skips author-defined motion once and then returns to normal.
  const shouldSkipNextOpenRef = React.useRef(false);
  // Keyframe mount animations on initially open panels cause a visible layout
  // shift during the server-rendered first paint, so suppress that first open
  // lifecycle until the panel has been closed once.
  const shouldPreventMountAnimationRef = React.useRef(open);
  // React.Activity tears down Effects while preserving state, so revealing an
  // already-open panel would otherwise replay its CSS keyframe open animation.
  const shouldPreventActivityResumeAnimationRef = React.useRef(false);
  // Some open paths intentionally bypass motion, but the shared root transition
  // status still advances asynchronously. Override the panel to idle so its data
  // attributes and dimension cleanup reflect the immediate open state.
  const [forcePanelIdle, setForcePanelIdle] = React.useState(false);
  const pendingTemporaryStyleRestoreRef = React.useRef(null);
  const mergedPanelRef = (0, _useMergedRefs.useMergedRefs)(externalRef, panelRef);
  const latestOpenRef = (0, _useValueAsRef.useValueAsRef)(open);
  // Only used to handle panel close
  const runOnceCloseAnimationsFinish = (0, _useAnimationsFinished.useAnimationsFinished)(panelRef);
  const hidden = !open && !mounted;
  const panelTransitionStatus = forcePanelIdle ? 'idle' : transitionStatus;
  const shouldPreventOpenAnimation = open && (
  // These 2 refs are safe to read in render, they are only written from committed
  // layout/effect paths and gate one-shot motion suppression for the next open
  // lifecycle. They intentionally expose the last committed motion snapshot.
  shouldPreventMountAnimationRef.current || shouldPreventActivityResumeAnimationRef.current);
  const renderedDimensions = !open && mounted &&
  // These 2 refs are also safe to read in render, both hold the last committed
  // animation mode and measurement. This fallback only restores a previously
  // measured pixel size after the live dimensions state has been reset back to `auto`.
  animationTypeRef.current === 'css-animation' && dimensions.height === undefined && dimensions.width === undefined ? lastMeasuredDimensionsRef.current : dimensions;
  const shouldPersistHiddenTransitionStyles = hiddenUntilFound && hidden && animationTypeRef.current !== 'css-animation';

  // Most measured dimensions are reused later when CSS keyframe closes need a
  // pixel size after the rendered dimensions have been reset back to `auto`.
  // Passing `false` is only for clearing the current dimensions state.
  const setDimensions = (0, _useStableCallback.useStableCallback)((nextDimensions, shouldCacheMeasurement = true) => {
    if (shouldCacheMeasurement) {
      lastMeasuredDimensionsRef.current = nextDimensions;
    }
    setDimensionsUnwrapped(nextDimensions);
  });
  const restorePendingTemporaryStyle = (0, _useStableCallback.useStableCallback)(() => {
    pendingTemporaryStyleRestoreRef.current?.();
    pendingTemporaryStyleRestoreRef.current = null;
  });
  const setPendingTemporaryStyleRestore = (0, _useStableCallback.useStableCallback)(restore => {
    restorePendingTemporaryStyle();
    pendingTemporaryStyleRestoreRef.current = () => {
      pendingTemporaryStyleRestoreRef.current = null;
      restore();
    };
  });

  // React.Activity unmounts Effects while preserving component state. If that
  // teardown happens while an already-open keyframe panel is visible, remember
  // to suppress the replayed open animation on the next committed reveal.
  const markActivityResumeAnimationSuppressed = (0, _useStableCallback.useStableCallback)(() => {
    if (open && mounted && animationTypeRef.current === 'css-animation') {
      shouldPreventActivityResumeAnimationRef.current = true;
    }
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // `forcePanelIdle` is only a temporary override for open paths that skip
    // motion. Keep it active while the shared root still reports `starting`,
    // then drop it once the root transition state catches up.
    if (!forcePanelIdle || transitionStatus === 'starting') {
      return;
    }
    setForcePanelIdle(false);
  }, [forcePanelIdle, transitionStatus]);
  React.useEffect(() => {
    return () => {
      markActivityResumeAnimationSuppressed();
      restorePendingTemporaryStyle();
    };
  }, [markActivityResumeAnimationSuppressed, restorePendingTemporaryStyle]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }

    // `beforematch` can temporarily force a `0s` motion duration so the matched
    // content reveals immediately. Restore the authored duration before detecting
    // the next close animation type, otherwise that first close is misread as
    // "no motion" and the close transition or keyframe gets skipped.
    if (!open && pendingTemporaryStyleRestoreRef.current) {
      restorePendingTemporaryStyle();
    }
    const animationType = getAnimationType(panel, shouldPreventOpenAnimation);
    animationTypeRef.current = animationType;

    // Initially open keyframe panels skip their first paint animation to avoid
    // layout shift, but we still need to cache the expanded size so the first
    // close animation can start from pixels instead of `auto`.
    if (open && transitionStatus === 'idle' && shouldPreventMountAnimationRef.current && animationType === 'css-animation') {
      lastMeasuredDimensionsRef.current = getDimensions(panel);
      return undefined;
    }

    // Handle the opening pass: measure the expanded size and, when necessary,
    // neutralize author-defined motion so the panel can open immediately.
    if (open && transitionStatus === 'starting') {
      // `beforematch` opens should reveal the panel immediately so find-in-page
      // does not wait for the author-defined transition or animation to finish.
      const skipNextOpen = shouldSkipNextOpenRef.current;
      shouldSkipNextOpenRef.current = false;
      if (animationType === 'none') {
        setDimensions(getDimensions(panel));
        setForcePanelIdle(true);
        return undefined;
      }
      if (animationType === 'css-transition') {
        const restoreLayoutStyles = resetLayoutStyles(panel);
        setDimensions(getDimensions(panel));
        if (!skipNextOpen) {
          return restoreLayoutStyles;
        }
        const restoreTransitionDuration = setTemporaryStyle(panel, 'transition-duration', '0s');
        setPendingTemporaryStyleRestore(restoreTransitionDuration);
        setForcePanelIdle(true);
        return restoreLayoutStyles;
      }
      setDimensions(getDimensions(panel));
      const restoreAnimationName = setTemporaryStyle(panel, 'animation-name', 'none');
      if (!skipNextOpen) {
        restoreAnimationName();
        return undefined;
      }
      const restoreAnimationDuration = setTemporaryStyle(panel, 'animation-duration', '0s');
      restoreAnimationName();
      setPendingTemporaryStyleRestore(restoreAnimationDuration);
      setForcePanelIdle(true);
      return undefined;
    }

    // Capture the current size as soon as close is requested, before the
    // deferred ending phase applies closed styles. This keeps close transitions
    // starting from a measured pixel value, including interrupted opens.
    if (!open && mounted && (transitionStatus === 'idle' || transitionStatus === 'starting')) {
      shouldPreventMountAnimationRef.current = false;
      shouldPreventActivityResumeAnimationRef.current = false;
      if (animationType === 'none') {
        setDimensions(EMPTY_DIMENSIONS, false);
        setMounted(false);
        return undefined;
      }
      setDimensions(getDimensions(panel));
      return undefined;
    }
    if (transitionStatus !== 'ending') {
      return undefined;
    }

    // Reachable when `transitionStatus` already flipped to `ending` before this effect ran, so
    // the close branch above was skipped. Without motion there is nothing to wait for, so unmount
    // here instead of deferring to the animation-finished path below.
    if (animationType === 'none') {
      setMounted(false);
      return undefined;
    }
    const nextDimensions = getDimensions(panel);
    const hasMeasuredSize = nextDimensions.height > 0 || nextDimensions.width > 0;
    if (!hasMeasuredSize) {
      setMounted(false);
      return undefined;
    }
    setDimensions(nextDimensions);
    if (animationType === 'css-animation') {
      const restoreAnimationName = setTemporaryStyle(panel, 'animation-name', 'none');
      restoreAnimationName();
    }
    return undefined;
  }, [mounted, open, restorePendingTemporaryStyle, setDimensions, setMounted, setPendingTemporaryStyleRestore, shouldPreventOpenAnimation, transitionStatus]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    enabled: open && mounted && panelTransitionStatus === 'idle',
    open: true,
    ref: panelRef,
    onComplete() {
      // `useOpenChangeComplete` only aborts from its effect cleanup, which React runs in the
      // post-paint passive flush. An animation's `finished` microtask can resolve after the render
      // that set `open` to `false` but before that cleanup, so re-check the latest value here.
      // Clearing the measured size in that window would make the close transition start from
      // `height: 0` instead of the expanded pixel height.
      if (!open) {
        return;
      }
      setDimensions(EMPTY_DIMENSIONS, false);
    }
  });

  // Closing panels need extra sequencing beyond `useOpenChangeComplete`.
  // This passive effect runs after the `ending` render has committed, so
  // `[data-ending-style]` is already present. Chrome can still register the
  // exit transition one frame later when an Accordion closes one item while
  // opening another, so wait one frame before watching animations.
  // See https://github.com/mui/base-ui/issues/3099
  React.useEffect(() => {
    if (open || !mounted || panelTransitionStatus !== 'ending') {
      return undefined;
    }
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }
    const abortController = new AbortController();
    let endingStyleFrame = -1;
    function handleComplete() {
      // Same post-paint race as the `useOpenChangeComplete` callback above, except `open` is
      // captured by this effect's closure and always `false` here, so read the latest value from
      // a ref. Unmounting a panel that has already reopened would drop it from the DOM.
      if (latestOpenRef.current) {
        return;
      }
      setMounted(false);
      setDimensions(EMPTY_DIMENSIONS, false);
    }
    endingStyleFrame = _useAnimationFrame.AnimationFrame.request(() => {
      runOnceCloseAnimationsFinish(handleComplete, abortController.signal);
    });
    return () => {
      _useAnimationFrame.AnimationFrame.cancel(endingStyleFrame);
      abortController.abort();
    };
  }, [latestOpenRef, mounted, open, panelTransitionStatus, runOnceCloseAnimationsFinish, setDimensions, setMounted]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const panel = panelRef.current;
    if (!panel || !hiddenUntilFound || !hidden) {
      return;
    }

    // React only supports a boolean for the `hidden` attribute and forces
    // legit string values to booleans so we have to force it back in the DOM
    // when necessary: https://github.com/react/react/issues/24740
    panel.setAttribute('hidden', 'until-found');
  }, [hidden, hiddenUntilFound]);
  React.useEffect(function registerBeforeMatchListener() {
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }
    function handleBeforeMatch(event) {
      const eventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event);
      onOpenChange(true, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      shouldSkipNextOpenRef.current = true;
      setOpen(true);
    }
    return (0, _addEventListener.addEventListener)(panel, 'beforematch', handleBeforeMatch);
  }, [onOpenChange, setOpen]);
  const shouldRender = keepMounted || hiddenUntilFound || mounted || open;
  return {
    height: renderedDimensions.height,
    props: {
      ...(shouldPersistHiddenTransitionStyles ? {
        [CollapsiblePanelDataAttributes.startingStyle]: ''
      } : undefined),
      hidden,
      id: idParam
    },
    ref: mergedPanelRef,
    shouldPreventOpenAnimation,
    shouldRender,
    transitionStatus: panelTransitionStatus,
    width: renderedDimensions.width
  };
}
function getDimensions(element) {
  return {
    height: element.scrollHeight,
    width: element.scrollWidth
  };
}
function getAnimationType(element, hasSuppressedMountAnimation) {
  const panelStyles = (0, _owner.ownerWindow)(element).getComputedStyle(element);
  const hasAnimation = (panelStyles.animationName.split(',').map(name => name.trim()).some(name => name !== '' && name !== 'none') || hasSuppressedMountAnimation) && hasNonZeroDuration(panelStyles.animationDuration);
  const hasTransition = hasNonZeroDuration(panelStyles.transitionDuration);
  if (hasAnimation && hasTransition) {
    /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
    if (process.env.NODE_ENV !== 'production') {
      (0, _warn.warn)('CSS transitions and CSS animations both detected on Collapsible or Accordion panel.', 'Only one of either animation type should be used.');
    }
    return 'css-transition';
  }
  if (hasTransition) {
    return 'css-transition';
  }
  if (hasAnimation) {
    return 'css-animation';
  }
  return 'none';
}
function hasNonZeroDuration(value) {
  return value.split(',').map(part => part.trim()).some(part => part !== '' && Number.parseFloat(part) > 0);
}

/**
 * Temporarily overrides an inline style property and returns a cleanup that
 * restores the previous inline value and priority.
 * @param element - The element whose inline style should be updated.
 * @param property - The CSS property name to override.
 * @param value - The temporary value to assign.
 * @returns A cleanup function that restores the original inline style state.
 */
function setTemporaryStyle(element, property, value) {
  const previousValue = element.style.getPropertyValue(property);
  const previousPriority = element.style.getPropertyPriority(property);
  element.style.setProperty(property, value);
  return () => {
    if (previousValue === '') {
      element.style.removeProperty(property);
      return;
    }
    element.style.setProperty(property, previousValue, previousPriority);
  };
}

/**
 * Temporarily resets inline alignment styles that can distort scroll-based
 * size measurements, then restores them on the next animation frame.
 * @param element - The panel element being measured.
 * @returns A cleanup function that cancels the scheduled restore and reapplies
 * the original inline layout styles immediately.
 */
function resetLayoutStyles(element) {
  const originalLayoutStyles = {
    'justify-content': element.style.justifyContent,
    'align-items': element.style.alignItems,
    'align-content': element.style.alignContent,
    'justify-items': element.style.justifyItems
  };
  Object.keys(originalLayoutStyles).forEach(key => {
    element.style.setProperty(key, 'initial', 'important');
  });
  function restoreLayoutStyles() {
    Object.entries(originalLayoutStyles).forEach(([key, value]) => {
      if (value === '') {
        element.style.removeProperty(key);
        return;
      }
      element.style.setProperty(key, value);
    });
  }
  const frame = _useAnimationFrame.AnimationFrame.request(restoreLayoutStyles);
  return () => {
    _useAnimationFrame.AnimationFrame.cancel(frame);
    restoreLayoutStyles();
  };
}