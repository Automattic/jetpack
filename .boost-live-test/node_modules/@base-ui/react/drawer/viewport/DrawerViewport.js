"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _dom = require("@floating-ui/utils/dom");
var _addEventListener = require("@base-ui/utils/addEventListener");
var _owner = require("@base-ui/utils/owner");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _clamp = require("@base-ui/utils/clamp");
var _DialogRootContext = require("../../dialog/root/DialogRootContext");
var _DialogViewport = require("../../dialog/viewport/DialogViewport");
var DialogViewportDataAttributes = _interopRequireWildcard(require("../../dialog/viewport/DialogViewportDataAttributes"));
var _mergeProps = require("../../merge-props");
var _DrawerRootContext = require("../root/DrawerRootContext");
var _useDrawerSnapPoints = require("../root/useDrawerSnapPoints");
var _DrawerProviderContext = require("../provider/DrawerProviderContext");
var _useSwipeDismiss = require("../../utils/useSwipeDismiss");
var DrawerPopupCssVars = _interopRequireWildcard(require("../popup/DrawerPopupCssVars"));
var DrawerPopupDataAttributes = _interopRequireWildcard(require("../popup/DrawerPopupDataAttributes"));
var DrawerBackdropCssVars = _interopRequireWildcard(require("../backdrop/DrawerBackdropCssVars"));
var _drawerContentAttribute = require("../content/drawerContentAttribute");
var _reasons = require("../../internals/reasons");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _utils = require("../../floating-ui-react/utils");
var _DrawerViewportContext = require("./DrawerViewportContext");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _scrollable = require("../../utils/scrollable");
var _constants = require("../../internals/constants");
var _getElementAtPoint = require("../../utils/getElementAtPoint");
var _DrawerVirtualKeyboardContext = require("../virtual-keyboard-provider/DrawerVirtualKeyboardContext");
var _jsxRuntime = require("react/jsx-runtime");
const MIN_SWIPE_THRESHOLD = 10;
const FAST_SWIPE_VELOCITY = 0.5;
const SNAP_VELOCITY_THRESHOLD = 0.5;
const SNAP_VELOCITY_MULTIPLIER = 300;
const MAX_SNAP_VELOCITY = 4;
const MIN_SWIPE_RELEASE_VELOCITY = 0.2;
const MAX_SWIPE_RELEASE_VELOCITY = 4;
const MIN_SWIPE_RELEASE_DURATION_MS = 80;
const MAX_SWIPE_RELEASE_DURATION_MS = 360;
const MIN_SWIPE_RELEASE_SCALAR = 0.1;
const MAX_SWIPE_RELEASE_SCALAR = 1;
const AXIS_LOCK_SLOP = 6;
const AXIS_LOCK_BIAS = 2;
const DRAWER_CONTENT_SELECTOR = `[${_drawerContentAttribute.DRAWER_CONTENT_ATTRIBUTE}]`;
/**
 * A positioning container for the drawer popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerViewport = exports.DrawerViewport = /*#__PURE__*/React.forwardRef(function DrawerViewport(props, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = props;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const popupRef = store.context.popupRef;
  const backdropRef = store.context.backdropRef;
  const {
    swipeDirection,
    notifyParentSwipingChange,
    notifyParentSwipeProgressChange,
    frontmostHeight,
    snapToSequentialPoints,
    swipeAreaActiveRef
  } = (0, _DrawerRootContext.useDrawerRootContext)();
  const providerContext = (0, _DrawerProviderContext.useDrawerProviderContext)();
  const {
    snapPoints,
    resolvedSnapPoints,
    activeSnapPoint,
    activeSnapPointOffset,
    setActiveSnapPoint,
    popupHeight
  } = (0, _useDrawerSnapPoints.useDrawerSnapPoints)();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDrawerCount = store.useState('nestedOpenDrawerCount');
  const viewportElement = store.useState('viewportElement');
  const popupElementState = store.useState('popupElement');
  const visualStateStore = providerContext?.visualStateStore;
  const nestedDrawerOpen = nestedOpenDrawerCount > 0;
  const scrollAxis = swipeDirection === 'left' || swipeDirection === 'right' ? 'horizontal' : 'vertical';
  const isVerticalScrollAxis = scrollAxis === 'vertical';
  const crossScrollAxis = isVerticalScrollAxis ? 'horizontal' : 'vertical';
  const [swipeRelease, setSwipeRelease] = React.useState(null);
  const pendingSwipeCloseSnapPointRef = React.useRef(undefined);
  const resetSwipeRef = React.useRef(null);
  const controlledDismissFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const swipingRef = React.useRef(false);
  const nestedSwipeActiveRef = React.useRef(false);
  const lastPointerTypeRef = React.useRef('');
  const ignoreNextTouchStartFromPenRef = React.useRef(false);
  const ignoreTouchSwipeRef = React.useRef(false);
  const touchScrollStateRef = React.useRef(null);
  const virtualKeyboard = (0, _DrawerVirtualKeyboardContext.useDrawerVirtualKeyboardContext)();
  const snapPointRange = React.useMemo(() => {
    if (!snapPoints || snapPoints.length < 2 || resolvedSnapPoints.length < 2 || swipeDirection !== 'down' && swipeDirection !== 'up') {
      return null;
    }
    const offsets = resolvedSnapPoints.map(point => point.offset).sort((a, b) => a - b);
    const minOffset = offsets[0];
    const nextOffset = offsets[1];
    const range = nextOffset - minOffset;
    return {
      minOffset,
      range
    };
  }, [resolvedSnapPoints, snapPoints, swipeDirection]);
  const snapPointProgress = React.useMemo(() => {
    if (!snapPointRange || activeSnapPointOffset === null) {
      return null;
    }
    return (0, _clamp.clamp)((activeSnapPointOffset - snapPointRange.minOffset) / snapPointRange.range, 0, 1);
  }, [activeSnapPointOffset, snapPointRange]);
  const swipeDirections = React.useMemo(() => {
    if (snapPoints && snapPoints.length > 0 && (swipeDirection === 'down' || swipeDirection === 'up')) {
      return swipeDirection === 'down' ? ['down', 'up'] : ['up', 'down'];
    }
    return [swipeDirection];
  }, [snapPoints, swipeDirection]);
  const setSwipeDismissed = (0, _useStableCallback.useStableCallback)(dismissed => {
    popupRef.current?.toggleAttribute(DrawerPopupDataAttributes.swipeDismiss, dismissed);
    backdropRef.current?.toggleAttribute(DrawerPopupDataAttributes.swipeDismiss, dismissed);
  });
  const clearSwipeRelease = (0, _useStableCallback.useStableCallback)(() => {
    setSwipeDismissed(false);
    popupRef.current?.removeAttribute(_stateAttributesMapping.TransitionStatusDataAttributes.endingStyle);
    setSwipeRelease(null);
  });
  const finishNestedSwipe = (0, _useStableCallback.useStableCallback)(() => {
    if (!nestedSwipeActiveRef.current) {
      return;
    }
    nestedSwipeActiveRef.current = false;
    notifyParentSwipingChange?.(false);
  });
  const applySwipeProgress = (0, _useStableCallback.useStableCallback)((resolvedProgress, shouldTrackProgress, notifyParent) => {
    const isActive = open && !nested && shouldTrackProgress;
    const swipeProgress = isActive ? resolvedProgress : 0;
    const nestedSwipeProgress = open && shouldTrackProgress ? resolvedProgress : 0;
    if (notifyParent && notifyParentSwipeProgressChange) {
      notifyParentSwipeProgressChange(nestedSwipeProgress);
      if (nestedSwipeProgress <= 0) {
        finishNestedSwipe();
      }
    }
    visualStateStore?.set({
      swipeProgress,
      frontmostHeight: swipeProgress > 0 ? frontmostHeight : 0
    });
    const backdropElement = backdropRef.current;
    if (!backdropElement) {
      return;
    }
    const showProgress = isActive && swipeProgress > 0;
    backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, showProgress ? `${swipeProgress}` : '0');
    if (showProgress && frontmostHeight > 0) {
      backdropElement.style.setProperty(DrawerPopupCssVars.height, `${frontmostHeight}px`);
    } else {
      backdropElement.style.removeProperty(DrawerPopupCssVars.height);
    }
  });
  function resolveSwipeRelease(popupElement, direction, deltaX, deltaY, velocityX, velocityY, releaseVelocityX, releaseVelocityY) {
    const size = getBaseSwipeSize(popupElement, direction);
    if (size <= 0) {
      return null;
    }

    // The snap point base offset shifts the popup along the dismiss direction for both
    // `down` (+offset) and `up` (-offset), so it always adds to the directional translation.
    const snapPointBaseOffset = (direction === 'down' || direction === 'up') && snapPoints && snapPoints.length > 0 ? activeSnapPointOffset ?? 0 : 0;
    const translationAlongDirection = snapPointBaseOffset + (0, _useSwipeDismiss.getDisplacement)(direction, deltaX, deltaY);
    const remainingDistance = Math.max(0, size - translationAlongDirection);
    if (remainingDistance <= 0) {
      return null;
    }
    const releaseVelocity = (0, _useSwipeDismiss.getDisplacement)(direction, releaseVelocityX, releaseVelocityY);
    const directionalVelocity = Math.abs(releaseVelocity) > 0 ? releaseVelocity : (0, _useSwipeDismiss.getDisplacement)(direction, velocityX, velocityY);
    if (directionalVelocity <= MIN_SWIPE_RELEASE_VELOCITY) {
      return null;
    }
    const clampedVelocity = (0, _clamp.clamp)(directionalVelocity, MIN_SWIPE_RELEASE_VELOCITY, MAX_SWIPE_RELEASE_VELOCITY);
    // The gesture hook supplies finite deltas and velocities. The guards above keep the remaining
    // distance and divisor positive, so the duration stays within [MIN, MAX] and the resulting
    // scalar within (0, 1].
    const durationMs = (0, _clamp.clamp)(remainingDistance / clampedVelocity, MIN_SWIPE_RELEASE_DURATION_MS, MAX_SWIPE_RELEASE_DURATION_MS);
    const normalizedDuration = (durationMs - MIN_SWIPE_RELEASE_DURATION_MS) / (MAX_SWIPE_RELEASE_DURATION_MS - MIN_SWIPE_RELEASE_DURATION_MS);
    return MIN_SWIPE_RELEASE_SCALAR + normalizedDuration * (MAX_SWIPE_RELEASE_SCALAR - MIN_SWIPE_RELEASE_SCALAR);
  }
  function updateNestedSwipeActive(details) {
    if (nestedSwipeActiveRef.current || !details) {
      return;
    }
    const direction = details.direction ?? swipeDirection;
    const delta = (0, _useSwipeDismiss.getDisplacement)(direction, details.deltaX, details.deltaY);
    if (Math.abs(delta) < MIN_SWIPE_THRESHOLD) {
      return;
    }
    nestedSwipeActiveRef.current = true;
    notifyParentSwipingChange?.(true);
  }
  const swipe = (0, _useSwipeDismiss.useSwipeDismiss)({
    enabled: mounted && !nestedDrawerOpen,
    directions: swipeDirections,
    elementRef: store.context.popupRef,
    ignoreSelectorWhenTouch: false,
    ignoreScrollableAncestors: true,
    movementCssVars: {
      x: DrawerPopupCssVars.swipeMovementX,
      y: DrawerPopupCssVars.swipeMovementY
    },
    onSwipeStart(event) {
      if ('touches' in event || event.pointerType === 'touch') {
        return;
      }
      const popupElement = popupRef.current;
      const doc = (0, _owner.ownerDocument)(popupElement);
      const selection = doc.getSelection?.();
      if (!selection || selection.isCollapsed) {
        return;
      }
      const anchorElement = (0, _dom.isElement)(selection.anchorNode) ? selection.anchorNode : selection.anchorNode?.parentElement;
      const focusElement = (0, _dom.isElement)(selection.focusNode) ? selection.focusNode : selection.focusNode?.parentElement;
      if (!(0, _utils.contains)(popupElement, anchorElement) && !(0, _utils.contains)(popupElement, focusElement)) {
        return;
      }
      selection.removeAllRanges();
    },
    onSwipingChange(swiping) {
      swipingRef.current = swiping;
      setBackdropSwipingAttribute(store.context.backdropRef.current, swiping);
      if (!swiping && !notifyParentSwipeProgressChange) {
        finishNestedSwipe();
      }
    },
    swipeThreshold({
      element,
      direction
    }) {
      return getBaseSwipeThreshold(element, direction);
    },
    canStart(position, details) {
      const popupElement = store.context.popupRef.current;
      if (!popupElement) {
        return false;
      }
      const doc = popupElement.ownerDocument;
      const elementAtPoint = (0, _getElementAtPoint.getElementAtPoint)(popupElement.getRootNode(), position.x, position.y);
      if (!elementAtPoint || !(0, _utils.contains)(popupElement, elementAtPoint)) {
        return false;
      }
      const nativeEvent = details.nativeEvent;
      const touchLike = 'touches' in nativeEvent || nativeEvent.pointerType === 'touch';
      if (touchLike && shouldIgnoreSwipeForTextSelection(doc, popupElement)) {
        return false;
      }
      return true;
    },
    onProgress(progress, details) {
      const swiping = swipingRef.current;
      if (swiping) {
        updateNestedSwipeActive(details);
      }
      const hasSnapPoints = Boolean(snapPoints && snapPoints.length > 0);
      if (swiping && swipeDirection === 'down' && hasSnapPoints && details) {
        const popupElement = store.context.popupRef.current;
        if (popupElement) {
          popupElement.style.removeProperty('transform');
          popupElement.style.setProperty(DrawerPopupCssVars.swipeMovementY, `${(0, _useDrawerSnapPoints.getSnapPointSwipeMovement)(activeSnapPointOffset ?? 0, details.deltaY)}px`);
        }
      }
      let resolvedProgress = progress;
      if (snapPointRange && popupHeight > 0) {
        const baseOffset = activeSnapPointOffset ?? snapPointRange.minOffset;
        const offsetToProgress = nextOffset => (0, _clamp.clamp)((nextOffset - snapPointRange.minOffset) / snapPointRange.range, 0, 1);

        // Outside a drag the hook still reports the last drag deltas, both after a release and
        // on a gesture that never started (e.g. a press inside `Drawer.Content`). Recomputing
        // from them would re-apply drag progress to a drawer that rests on its snap point.
        if (swiping && details && Number.isFinite(details.deltaY)) {
          resolvedProgress = offsetToProgress((0, _clamp.clamp)(baseOffset + details.deltaY, 0, popupHeight));
        } else if (snapPointProgress !== null) {
          resolvedProgress = snapPointProgress;
        }
      }

      // A parent drawer follows an active drag only, so drop it back to zero once the drag ends.
      if (!swiping) {
        notifyParentSwipeProgressChange?.(0);
        finishNestedSwipe();
      }
      applySwipeProgress(resolvedProgress, true, swiping);
    },
    onRelease({
      event,
      deltaX,
      deltaY,
      direction,
      velocityX,
      velocityY,
      releaseVelocityX,
      releaseVelocityY
    }) {
      const popupElement = store.context.popupRef.current;
      if (!popupElement) {
        clearSwipeRelease();
        return undefined;
      }
      const releasePopupElement = popupElement;
      function startSwipeRelease(resolvedDirection) {
        // Start ending transition styles earlier and synchronously to prevent a period where
        // the popup appears stuck on release before the actual closing animation starts.
        finishNestedSwipe();
        setSwipeDismissed(true);
        releasePopupElement.style.removeProperty('transition');
        releasePopupElement.setAttribute(_stateAttributesMapping.TransitionStatusDataAttributes.endingStyle, '');
        ReactDOM.flushSync(() => {
          setSwipeRelease(resolveSwipeRelease(releasePopupElement, resolvedDirection, deltaX, deltaY, velocityX, velocityY, releaseVelocityX, releaseVelocityY));
        });
      }
      if (!snapPoints || snapPoints.length === 0) {
        if (!direction) {
          clearSwipeRelease();
          return undefined;
        }
        const directionalDelta = (0, _useSwipeDismiss.getDisplacement)(direction, deltaX, deltaY);
        if (directionalDelta <= 0) {
          clearSwipeRelease();
          return false;
        }
        if ((0, _useSwipeDismiss.getDisplacement)(direction, velocityX, velocityY) >= FAST_SWIPE_VELOCITY) {
          startSwipeRelease(direction);
          return true;
        }
        const shouldClose = directionalDelta > getBaseSwipeThreshold(releasePopupElement, direction);
        if (shouldClose) {
          startSwipeRelease(direction);
        } else {
          clearSwipeRelease();
        }
        return shouldClose;
      }
      if (swipeDirection !== 'down' && swipeDirection !== 'up') {
        clearSwipeRelease();
        return undefined;
      }
      if (!popupHeight) {
        clearSwipeRelease();
        return false;
      }
      if (resolvedSnapPoints.length === 0) {
        clearSwipeRelease();
        return undefined;
      }
      const dragDelta = swipeDirection === 'down' ? deltaY : -deltaY;
      const dragDirection = Math.sign(dragDelta);
      const releaseDirectionalVelocity = swipeDirection === 'down' ? releaseVelocityY : -releaseVelocityY;
      const fallbackDirectionalVelocity = swipeDirection === 'down' ? velocityY : -velocityY;
      let resolvedDirectionalVelocity = releaseDirectionalVelocity;
      if (dragDirection !== 0 && Math.abs(dragDelta) >= MIN_SWIPE_THRESHOLD) {
        const velocityDirection = Math.sign(resolvedDirectionalVelocity);
        if (velocityDirection !== 0 && velocityDirection !== dragDirection) {
          // Ignore touch reversals that would otherwise flip the snap decision.
          resolvedDirectionalVelocity = fallbackDirectionalVelocity;
        }
      }
      const currentOffset = activeSnapPointOffset ?? 0;
      const dragTargetOffset = (0, _clamp.clamp)(currentOffset + dragDelta, 0, popupHeight);
      const velocityOffset = Math.abs(resolvedDirectionalVelocity) >= SNAP_VELOCITY_THRESHOLD ? (0, _clamp.clamp)(resolvedDirectionalVelocity, -MAX_SNAP_VELOCITY, MAX_SNAP_VELOCITY) * SNAP_VELOCITY_MULTIPLIER : 0;
      const targetOffset = snapToSequentialPoints ? dragTargetOffset : (0, _clamp.clamp)(dragTargetOffset + velocityOffset, 0, popupHeight);
      const snapPointEventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.swipe, event);
      const settleInPlace = () => {
        // Reset nested swipe state now: the hook's trailing progress update is deduped
        // when the drag never produced dismissal progress, so it may not fire.
        applySwipeProgress(0, true, true);
        clearSwipeRelease();
        return false;
      };
      const settleOnSnapPoint = snapPoint => {
        setActiveSnapPoint(snapPoint.value, snapPointEventDetails);
        return settleInPlace();
      };
      const closeFromSnapPoints = fallbackSnapPoint => {
        // An unattributed gesture (e.g. a mostly horizontal flick) may settle on a snap
        // point but must not dismiss: `useSwipeDismiss` drops a directionless dismissal,
        // stranding the popup visually closed while `open` stays `true`.
        if (!direction) {
          return settleOnSnapPoint(fallbackSnapPoint);
        }
        setActiveSnapPoint(null, snapPointEventDetails);
        if (snapPointEventDetails.isCanceled) {
          // A canceled null snap point rejects dismissal before exit styles start.
          return settleInPlace();
        }
        pendingSwipeCloseSnapPointRef.current = activeSnapPoint;
        startSwipeRelease(swipeDirection);
        return true;
      };
      if (snapToSequentialPoints) {
        const orderedSnapPoints = [...resolvedSnapPoints].sort((first, second) => first.offset - second.offset);
        const orderedOffsets = orderedSnapPoints.map(point => point.offset);
        const currentIndex = (0, _useDrawerSnapPoints.closestSnapPointIndex)(orderedOffsets, currentOffset);
        let targetSnapPoint = orderedSnapPoints[(0, _useDrawerSnapPoints.closestSnapPointIndex)(orderedOffsets, targetOffset)];
        const velocityDirection = Math.sign(resolvedDirectionalVelocity);
        const shouldAdvance = dragDirection !== 0 && velocityDirection !== 0 && velocityDirection === dragDirection && Math.abs(resolvedDirectionalVelocity) >= SNAP_VELOCITY_THRESHOLD;
        let effectiveTargetOffset = targetOffset;
        if (shouldAdvance) {
          const adjacentIndex = (0, _clamp.clamp)(currentIndex + dragDirection, 0, orderedSnapPoints.length - 1);
          if (adjacentIndex !== currentIndex) {
            const adjacentPoint = orderedSnapPoints[adjacentIndex];
            const shouldForceAdjacent = dragDirection > 0 ? targetOffset < adjacentPoint.offset : targetOffset > adjacentPoint.offset;
            if (shouldForceAdjacent) {
              targetSnapPoint = adjacentPoint;
              effectiveTargetOffset = adjacentPoint.offset;
            }
          } else if (dragDirection > 0) {
            return closeFromSnapPoints(targetSnapPoint);
          }
        }
        const closeDistance = Math.abs(effectiveTargetOffset - popupHeight);
        const snapDistance = Math.abs(effectiveTargetOffset - targetSnapPoint.offset);
        if (closeDistance < snapDistance) {
          return closeFromSnapPoints(targetSnapPoint);
        }
        return settleOnSnapPoint(targetSnapPoint);
      }
      const closestSnapPoint = resolvedSnapPoints[(0, _useDrawerSnapPoints.closestSnapPointIndex)(resolvedSnapPoints.map(point => point.offset), targetOffset)];
      if (resolvedDirectionalVelocity >= FAST_SWIPE_VELOCITY && dragDelta > 0) {
        return closeFromSnapPoints(closestSnapPoint);
      }
      const closeDistance = Math.abs(targetOffset - popupHeight);
      if (closeDistance < Math.abs(targetOffset - closestSnapPoint.offset)) {
        return closeFromSnapPoints(closestSnapPoint);
      }
      return settleOnSnapPoint(closestSnapPoint);
    },
    onDismiss(event) {
      visualStateStore?.set({
        swipeProgress: 0,
        frontmostHeight: 0
      });
      const backdropElement = store.context.backdropRef.current;
      if (backdropElement) {
        backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
      }
      const dismissEventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.swipe, event);
      store.setOpen(false, dismissEventDetails);
      if (dismissEventDetails.isCanceled) {
        const pendingSnapPoint = pendingSwipeCloseSnapPointRef.current;
        if (pendingSnapPoint !== undefined) {
          setActiveSnapPoint(pendingSnapPoint, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.swipe, event));
        }
        pendingSwipeCloseSnapPointRef.current = undefined;
        resetSwipeRef.current?.();
        clearSwipeRelease();
        return;
      }

      // In controlled mode, the effective open state may not have changed yet
      // (openProp takes precedence over state.open). Proceed optimistically with the
      // dismiss animation — React's Scheduler flushes before the next rAF, so we can
      // reliably check whether the parent accepted or rejected the close.
      // Note: if onOpenChange is asynchronous (e.g., closes the drawer after a network
      // call), the rAF check will see open === true, revert the animation, and the
      // drawer will close without animation when the parent eventually sets open={false}.
      if (store.select('open')) {
        const savedEvent = event;
        controlledDismissFrame.request(() => {
          if (store.select('open')) {
            // Parent rejected: revert animation and restore snap point.
            const pendingSnapPoint = pendingSwipeCloseSnapPointRef.current;
            if (pendingSnapPoint !== undefined) {
              setActiveSnapPoint(pendingSnapPoint, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.swipe, savedEvent));
            }
            pendingSwipeCloseSnapPointRef.current = undefined;
            clearSwipeRelease();
            resetSwipeRef.current?.();
          } else {
            // Parent accepted: clean up the ref.
            pendingSwipeCloseSnapPointRef.current = undefined;
          }
        });
        return;
      }
      pendingSwipeCloseSnapPointRef.current = undefined;
      setSwipeDismissed(true);
    }
  });
  const swipePointerProps = swipe.getPointerProps();
  const swipeTouchProps = swipe.getTouchProps();
  const {
    moveNative: moveSwipeNative,
    reset: resetSwipe
  } = swipe;
  resetSwipeRef.current = resetSwipe;
  React.useEffect(() => {
    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement) {
      return undefined;
    }
    const resolvedRootElement = rootElement;
    const doc = (0, _owner.ownerDocument)(resolvedRootElement);
    function processTouchMove(event, touchState, touch) {
      const drawerAxisDelta = isVerticalScrollAxis ? touch.clientY - touchState.lastY : touch.clientX - touchState.lastX;

      // Avoid blocking pinch zoom or text selection adjustments on iOS Safari.
      if (event.touches.length === 2) {
        return;
      }
      const allowTouchMove = shouldIgnoreSwipeForTextSelection(doc, resolvedRootElement);
      if (allowTouchMove || !open || !mounted || nestedDrawerOpen) {
        return;
      }
      if (shouldYieldTouchMove(touchState, event, touch, isVerticalScrollAxis)) {
        return;
      }
      const scrollTarget = touchState.scrollTarget;
      if (!scrollTarget || scrollTarget === doc.documentElement || scrollTarget === doc.body) {
        if (event.cancelable) {
          event.preventDefault();
        }
        // Claim the gesture before React's delegated touch handlers see it; dispatching the
        // move through React re-rasterizes the popup content on every frame.
        event.stopPropagation();
        moveSwipeNative(event, resolvedRootElement);
        return;
      }
      if (!hasScrollableContentOnAxis(scrollTarget, scrollAxis)) {
        // If the scroll container doesn't overflow on the drawer axis, prevent the window from
        // scrolling instead.
        if (event.cancelable) {
          event.preventDefault();
        }
        event.stopPropagation();
        return;
      }
      if (drawerAxisDelta !== 0) {
        const canSwipeFromScrollEdge = canSwipeFromScrollEdgeOnMove(scrollTarget, scrollAxis, swipeDirection, drawerAxisDelta);
        if (!touchState.allowSwipe) {
          if (event.cancelable && canSwipeFromScrollEdge) {
            touchState.allowSwipe = true;
            event.preventDefault();
          } else {
            touchState.allowSwipe = false;
          }
        } else if (event.cancelable) {
          event.preventDefault();
        }
      }
      if (touchState.allowSwipe === true) {
        event.stopPropagation();
        moveSwipeNative(event, resolvedRootElement);
      }
    }
    function handleNativeTouchMove(event) {
      // The virtual keyboard provider observes the move to tell a tap apart from a drag.
      // It must run even when the swipe gesture below claims the event with
      // `stopPropagation()`, which would otherwise prevent React's delegated handlers
      // (and the provider) from ever seeing the move.
      virtualKeyboard?.onTouchMove(event);
      if (ignoreTouchSwipeRef.current) {
        return;
      }
      const touchState = touchScrollStateRef.current;
      const touch = event.touches[0];
      if (!touch || !touchState) {
        return;
      }
      processTouchMove(event, touchState, touch);
      updateTouchScrollPosition(touchState, touch);
    }
    return (0, _addEventListener.addEventListener)(doc, 'touchmove', handleNativeTouchMove, {
      passive: false,
      capture: true
    });
  }, [mounted, nestedDrawerOpen, open, popupElementState, isVerticalScrollAxis, scrollAxis, swipeDirection, moveSwipeNative, viewportElement, virtualKeyboard]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!snapPointRange || swipe.swiping) {
      return;
    }
    applySwipeProgress(!open || nested ? 0 : snapPointProgress ?? 0, true, false);
  }, [applySwipeProgress, frontmostHeight, nested, notifyParentSwipeProgressChange, open, snapPointProgress, snapPointRange, swipe.swiping, store, visualStateStore]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!notifyParentSwipeProgressChange) {
      return undefined;
    }
    if (!open) {
      notifyParentSwipeProgressChange(0);
    }
    return () => {
      notifyParentSwipeProgressChange(0);
    };
  }, [notifyParentSwipeProgressChange, open]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open) {
      // Skip `resetSwipe` while `Drawer.SwipeArea` is driving the open: it zeroes the popup's
      // `--swipe-movement-*` (via `syncDragStyles(false)`), flashing it fully open for a frame.
      // `clearSwipeRelease` doesn't touch those vars, so always run it to clear any leftover
      // release state from a prior dismiss (e.g. when the popup is kept mounted).
      if (!swipeAreaActiveRef.current) {
        resetSwipe();
      }
      clearSwipeRelease();
    }
  }, [clearSwipeRelease, open, resetSwipe, swipeAreaActiveRef]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const backdropElement = backdropRef.current;
    return () => {
      visualStateStore?.set({
        swipeProgress: 0,
        frontmostHeight: 0
      });
      setBackdropSwipingAttribute(backdropElement, false);
      // `data-swiping` is set on whichever backdrop is current when a swipe starts, which can
      // differ from the captured element if the backdrop mounted late or changed identity.
      // Reading the live ref here is intentional so the current backdrop is cleared too.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentBackdrop = backdropRef.current;
      if (currentBackdrop !== backdropElement) {
        setBackdropSwipingAttribute(currentBackdrop, false);
      }
      finishNestedSwipe();
    };
  }, [backdropRef, finishNestedSwipe, visualStateStore]);
  const swipeProviderValue = React.useMemo(() => ({
    swiping: swipe.swiping,
    getDragStyles: swipe.getDragStyles,
    swipeStrength: swipeRelease ?? null,
    setSwipeDismissed
  }), [setSwipeDismissed, swipe.getDragStyles, swipe.swiping, swipeRelease]);
  function resetTouchSwipeState(ignoreSwipe) {
    ignoreTouchSwipeRef.current = ignoreSwipe;
    touchScrollStateRef.current = null;
  }
  function resetTouchTrackingState() {
    resetTouchSwipeState(false);
    lastPointerTypeRef.current = '';
    ignoreNextTouchStartFromPenRef.current = false;
  }
  function handlePointerEnd(event) {
    lastPointerTypeRef.current = '';
    return event.pointerType !== 'touch';
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_DialogViewport.DialogViewport, {
    ref: forwardedRef,
    className: className,
    style: style,
    render: render,
    ...(0, _mergeProps.mergeProps)(elementProps, {
      onPointerDown(event) {
        lastPointerTypeRef.current = event.pointerType;
        ignoreNextTouchStartFromPenRef.current = event.pointerType === 'pen';
        if (!open || !mounted || nestedDrawerOpen) {
          return;
        }
        const elementAtPoint = (0, _getElementAtPoint.getElementAtPoint)(event.currentTarget.getRootNode(), event.clientX, event.clientY);
        if (isSwipeIgnoredTarget(elementAtPoint) || isDrawerContentTarget(elementAtPoint)) {
          return;
        }
        if (event.pointerType === 'touch') {
          return;
        }
        swipePointerProps.onPointerDown?.(event);
      },
      onPointerMove(event) {
        if (event.pointerType === 'touch') {
          return;
        }
        swipePointerProps.onPointerMove?.(event);
      },
      onPointerUp(event) {
        if (handlePointerEnd(event)) {
          swipePointerProps.onPointerUp?.(event);
        }
      },
      onPointerCancel(event) {
        if (handlePointerEnd(event)) {
          swipePointerProps.onPointerCancel?.(event);
        }
      },
      onTouchStart(event) {
        const startedFromPenPointerDown = lastPointerTypeRef.current === 'pen' && ignoreNextTouchStartFromPenRef.current;
        if (startedFromPenPointerDown) {
          ignoreNextTouchStartFromPenRef.current = false;
          resetTouchSwipeState(false);
          return;
        }
        if (!open || !mounted || nestedDrawerOpen) {
          resetTouchSwipeState(false);
          return;
        }
        const touch = event.touches[0];
        if (!touch) {
          return;
        }
        if (isReactTouchEventOnRangeInput(event)) {
          resetTouchSwipeState(false);
          return;
        }
        const rootElement = event.currentTarget;
        const elementAtPoint = (0, _getElementAtPoint.getElementAtPoint)(rootElement.getRootNode(), touch.clientX, touch.clientY);
        const eventTarget = (0, _utils.getTarget)(event.nativeEvent);
        const target = (0, _dom.isElement)(eventTarget) ? eventTarget : rootElement;
        if (!(0, _utils.contains)(rootElement, target)) {
          resetTouchSwipeState(true);
          return;
        }
        virtualKeyboard?.onTouchStart(event);
        if (isSwipeIgnoredTarget(elementAtPoint)) {
          resetTouchSwipeState(true);
          return;
        }
        ignoreTouchSwipeRef.current = false;
        const scrollTarget = (0, _scrollable.findScrollableTouchTarget)(target, rootElement, scrollAxis);
        const hasCrossAxisScrollableContent = (0, _scrollable.findScrollableTouchTarget)(target, rootElement, crossScrollAxis) != null;
        let allowSwipe = null;
        if (scrollTarget) {
          const canSwipeFromEdge = isAtSwipeStartEdge(scrollTarget, scrollAxis, swipeDirection);
          allowSwipe = canSwipeFromEdge ? null : false;
        }
        touchScrollStateRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          lastX: touch.clientX,
          lastY: touch.clientY,
          scrollTarget,
          hasCrossAxisScrollableContent,
          allowSwipe,
          preserveNativeCrossAxisScroll: false,
          drawerAxisAttributed: false
        };
        swipeTouchProps.onTouchStart?.(event);
      },
      onTouchEnd(event) {
        virtualKeyboard?.onTouchEnd(event);
        resetTouchTrackingState();
        swipeTouchProps.onTouchEnd?.(event);
      },
      onTouchCancel(event) {
        virtualKeyboard?.onTouchCancel();
        resetTouchTrackingState();
        swipeTouchProps.onTouchCancel?.(event);
      },
      // Drawer popups use drawer-specific nested state attributes.
      // Suppress DialogViewport's generic nested dialog attribute.
      [DialogViewportDataAttributes.nestedDialogOpen]: undefined
    }),
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawerViewportContext.DrawerViewportContext.Provider, {
      value: swipeProviderValue,
      children: children
    })
  });
});
if (process.env.NODE_ENV !== "production") DrawerViewport.displayName = "DrawerViewport";
function setBackdropSwipingAttribute(backdropElement, swiping) {
  backdropElement?.toggleAttribute(DrawerPopupDataAttributes.swiping, swiping);
}
function isSwipeIgnoredTarget(target) {
  return Boolean(target?.closest(_constants.BASE_UI_SWIPE_IGNORE_SELECTOR));
}
function isDrawerContentTarget(target) {
  return Boolean(target?.closest(DRAWER_CONTENT_SELECTOR));
}
function getBaseSwipeSize(element, direction) {
  return direction === 'left' || direction === 'right' ? element.offsetWidth : element.offsetHeight;
}
function getBaseSwipeThreshold(element, direction) {
  return Math.max(getBaseSwipeSize(element, direction) * 0.5, MIN_SWIPE_THRESHOLD);
}
function isRangeInput(target, win) {
  return target instanceof win.HTMLInputElement && target.type === 'range';
}
function isTextSelectionControl(target) {
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}
function hasExpandedSelectionWithinTarget(selection, target) {
  const anchorElement = (0, _dom.isElement)(selection.anchorNode) ? selection.anchorNode : selection.anchorNode?.parentElement;
  const focusElement = (0, _dom.isElement)(selection.focusNode) ? selection.focusNode : selection.focusNode?.parentElement;
  return selection.containsNode(target, true) || (0, _utils.contains)(target, anchorElement) || (0, _utils.contains)(target, focusElement);
}
function shouldIgnoreSwipeForTextSelection(doc, rootElement) {
  const activeEl = (0, _utils.activeElement)(doc);
  if (activeEl && (0, _utils.contains)(rootElement, activeEl) && isTextSelectionControl(activeEl)) {
    const {
      selectionStart,
      selectionEnd
    } = activeEl;
    if (selectionStart != null && selectionEnd != null && selectionStart < selectionEnd) {
      return true;
    }
  }
  const selection = doc.getSelection?.();
  if (!selection || selection.isCollapsed) {
    return false;
  }
  return hasExpandedSelectionWithinTarget(selection, rootElement);
}
function isEventOnRangeInput(event, win) {
  return event.composedPath().some(pathTarget => isRangeInput(pathTarget, win));
}
function isReactTouchEventOnRangeInput(event) {
  return isEventOnRangeInput(event.nativeEvent, (0, _owner.ownerWindow)(event.currentTarget));
}
function updateTouchScrollPosition(touchState, touch) {
  touchState.lastX = touch.clientX;
  touchState.lastY = touch.clientY;
}

/**
 * Arbitrates a touchmove between the drawer swipe and a native cross-axis scroll.
 * Returns `true` when the move must be left alone — either because the cross axis already won the
 * gesture, or because neither axis has passed the slop yet and the gesture cannot be attributed.
 */
function shouldYieldTouchMove(touchState, event, touch, isVerticalScrollAxis) {
  if (touchState.preserveNativeCrossAxisScroll) {
    return true;
  }

  // Attribution happens once per gesture. Re-arbitrating after the drawer axis has won would let
  // the pre-attribution branches below fire mid-drag (the slop is measured from the touch origin,
  // which is never re-baselined), freezing the popup and dropping `preventDefault()`.
  if (touchState.drawerAxisAttributed || touchState.allowSwipe === true || !touchState.hasCrossAxisScrollableContent) {
    return false;
  }

  // A non-cancelable touchmove means the browser has already committed the gesture to a native
  // scroll; claiming it for the swipe would drag the popup alongside the scrolling content.
  if (!event.cancelable) {
    touchState.preserveNativeCrossAxisScroll = true;
    return true;
  }
  const drawerAxisGestureDelta = isVerticalScrollAxis ? touch.clientY - touchState.startY : touch.clientX - touchState.startX;
  const crossAxisGestureDelta = isVerticalScrollAxis ? touch.clientX - touchState.startX : touch.clientY - touchState.startY;
  const absDrawerAxisGestureDelta = Math.abs(drawerAxisGestureDelta);
  const absCrossAxisGestureDelta = Math.abs(crossAxisGestureDelta);
  if (absCrossAxisGestureDelta >= AXIS_LOCK_SLOP && absCrossAxisGestureDelta > absDrawerAxisGestureDelta + AXIS_LOCK_BIAS) {
    touchState.preserveNativeCrossAxisScroll = true;
    return true;
  }
  if (absDrawerAxisGestureDelta >= AXIS_LOCK_SLOP) {
    touchState.drawerAxisAttributed = true;
    return false;
  }

  // Neither axis has traveled past the slop yet, so the gesture cannot be attributed. Leave the
  // event alone: on iOS, `preventDefault()` on the first cancelable touchmove cancels native
  // scrolling for the entire gesture, which would lock a cross-axis scroll that only passes the
  // slop on a later move.
  return true;
}
function hasScrollableContentOnAxis(scrollTarget, axis) {
  return getScrollMetrics(scrollTarget, axis).max > 0;
}
function getScrollMetrics(scrollTarget, axis) {
  if (axis === 'vertical') {
    const max = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
    return {
      offset: scrollTarget.scrollTop,
      max
    };
  }
  const max = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth);
  return {
    offset: scrollTarget.scrollLeft,
    max
  };
}
function isAtSwipeStartEdge(scrollTarget, axis, direction) {
  const dismissFromStartEdge = shouldDismissFromStartEdge(direction, axis);
  const {
    offset,
    max
  } = getScrollMetrics(scrollTarget, axis);
  return dismissFromStartEdge ? offset <= 0 : offset >= max;
}
function canSwipeFromScrollEdgeOnMove(scrollTarget, axis, direction, delta) {
  const dismissFromStartEdge = shouldDismissFromStartEdge(direction, axis);
  const movingTowardDismiss = dismissFromStartEdge ? delta > 0 : delta < 0;
  if (!movingTowardDismiss) {
    return false;
  }
  return isAtSwipeStartEdge(scrollTarget, axis, direction);
}
function shouldDismissFromStartEdge(direction, axis) {
  return axis === 'vertical' ? direction === 'down' : direction === 'right';
}