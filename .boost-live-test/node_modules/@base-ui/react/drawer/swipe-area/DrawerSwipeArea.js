"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerSwipeArea = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _owner = require("@base-ui/utils/owner");
var _DialogRootContext = require("../../dialog/root/DialogRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _noop = require("../../internals/noop");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useSwipeDismiss = require("../../utils/useSwipeDismiss");
var _getElementTransform = require("../../utils/getElementTransform");
var DrawerPopupCssVars = _interopRequireWildcard(require("../popup/DrawerPopupCssVars"));
var DrawerPopupDataAttributes = _interopRequireWildcard(require("../popup/DrawerPopupDataAttributes"));
var DrawerBackdropCssVars = _interopRequireWildcard(require("../backdrop/DrawerBackdropCssVars"));
var _DrawerRootContext = require("../root/DrawerRootContext");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _popups = require("../../utils/popups");
var _DrawerProviderContext = require("../provider/DrawerProviderContext");
var _event = require("../../floating-ui-react/utils/event");
var DrawerSwipeAreaDataAttributes = _interopRequireWildcard(require("./DrawerSwipeAreaDataAttributes"));
const DEFAULT_SWIPE_OPEN_RATIO = 0.5;
const MIN_SWIPE_START_DISTANCE = 1;
const VELOCITY_THRESHOLD = 0.1;
const FALLBACK_SWIPE_OPEN_THRESHOLD = 40;
const SWIPE_AREA_OPEN_HOOK = {
  [DrawerSwipeAreaDataAttributes.open]: ''
};
const SWIPE_AREA_CLOSED_HOOK = {
  [DrawerSwipeAreaDataAttributes.closed]: ''
};
const SWIPE_AREA_SWIPING_HOOK = {
  [DrawerSwipeAreaDataAttributes.swiping]: ''
};
const SWIPE_AREA_DISABLED_HOOK = {
  [DrawerSwipeAreaDataAttributes.disabled]: ''
};
const stateAttributesMapping = {
  open(value) {
    return value ? SWIPE_AREA_OPEN_HOOK : SWIPE_AREA_CLOSED_HOOK;
  },
  swiping(value) {
    return value ? SWIPE_AREA_SWIPING_HOOK : null;
  },
  swipeDirection(value) {
    return {
      [DrawerSwipeAreaDataAttributes.swipeDirection]: value
    };
  },
  disabled(value) {
    return value ? SWIPE_AREA_DISABLED_HOOK : null;
  }
};
const oppositeSwipeDirection = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};
function resolveTouchAction(direction) {
  return direction === 'left' || direction === 'right' ? 'pan-y' : 'pan-x';
}

/**
 * An invisible area that listens for swipe gestures to open the drawer.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerSwipeArea = exports.DrawerSwipeArea = /*#__PURE__*/React.forwardRef(function DrawerSwipeArea(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled = false,
    swipeDirection: swipeDirectionProp,
    ...elementProps
  } = componentProps;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const {
    swipeDirection,
    frontmostHeight,
    swipeAreaActiveRef
  } = (0, _DrawerRootContext.useDrawerRootContext)();
  const providerContext = (0, _DrawerProviderContext.useDrawerProviderContext)();
  const [swipeActive, setSwipeActive] = React.useState(false);
  const swipeAreaRef = React.useRef(null);
  const swipeStartEventRef = React.useRef(null);
  const openedBySwipeRef = React.useRef(false);
  const dragDeltaRef = React.useRef({
    x: 0,
    y: 0
  });
  const closedOffsetRef = React.useRef(null);
  const appliedSwipeStylesRef = React.useRef(false);
  const swipePopupElementRef = React.useRef(null);
  const swipeBackdropElementRef = React.useRef(null);
  const popupTransitionRef = React.useRef(null);
  const releaseGuardCleanupRef = React.useRef(_noop.NOOP);
  const swipeAreaId = (0, _useBaseUiId.useBaseUiId)(componentProps.id);
  const registerTrigger = (0, _popups.useTriggerRegistration)(swipeAreaId, store);

  // `registerTrigger` is stable, so the ref does not re-fire when the id changes: re-register the
  // rendered element here instead. On React 17 the id also starts out `undefined`, so this is what
  // registers the swipe area at all.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    registerTrigger(swipeAreaRef.current);
    return () => registerTrigger(null);
  }, [registerTrigger, swipeAreaId, store]);
  const open = store.useState('open');
  const resetDragDelta = (0, _useStableCallback.useStableCallback)(() => {
    dragDeltaRef.current.x = 0;
    dragDeltaRef.current.y = 0;
  });
  const resolvedSwipeDirection = swipeDirectionProp ?? oppositeSwipeDirection[swipeDirection];
  const dismissDirection = oppositeSwipeDirection[resolvedSwipeDirection];
  const enabled = !disabled && (!open || swipeActive);
  function disableDismissForSwipe() {
    releaseGuardCleanupRef.current();
    store.context.outsidePressEnabledRef.current = false;
  }
  const enableDismissAfterRelease = (0, _useStableCallback.useStableCallback)(() => {
    releaseGuardCleanupRef.current();
    const doc = (0, _owner.ownerDocument)(swipeAreaRef.current);
    function restore(event) {
      // The gesture's trailing release click is the one physical click with no `pointerdown` of
      // its own. Ignore it and keep waiting, so it cannot dismiss the drawer it just opened,
      // while a click-only activation (keyboard or assistive tech) still re-enables in time.
      if (event?.type === 'click' && event.detail !== 0 && !(0, _event.isVirtualClick)(event)) {
        return;
      }
      releaseGuardCleanupRef.current = _noop.NOOP;
      doc.removeEventListener('pointerdown', restore, true);
      doc.removeEventListener('click', restore, true);
      store.context.outsidePressEnabledRef.current = true;
    }

    // The pointerup that ends a swipe-open gesture synthesizes a `click`. When the drag released
    // outside the popup (e.g. it was dragged past the popup's size), that click would be treated as
    // an outside press and immediately dismiss the drawer that was just opened. Keep outside-press
    // dismissal disabled until the next interaction that isn't that release click: a deliberate
    // outside press starts with a `pointerdown`, and a click-only activation (keyboard or
    // assistive tech) is distinguishable from a physical release. This is deterministic, unlike
    // re-enabling on a timer that can race the synthesized click and dismiss at random.
    //
    // `restore` runs in document capture, ahead of floating-ui's own outside-press check (which
    // happens on the event target, after capture), so the triggering press still dismisses.
    releaseGuardCleanupRef.current = restore;
    doc.addEventListener('pointerdown', restore, true);
    doc.addEventListener('click', restore, true);
  });
  function getPopupSize(popupElement) {
    const isHorizontal = dismissDirection === 'left' || dismissDirection === 'right';
    const size = isHorizontal ? popupElement.offsetWidth : popupElement.offsetHeight;
    if (size <= 0) {
      return null;
    }
    return size;
  }
  function resolvePopupSize() {
    const popupElement = store.context.popupRef.current;
    return popupElement ? getPopupSize(popupElement) : null;
  }
  function resolveClosedOffset(popupElement) {
    const offset = getPopupSize(popupElement);
    if (offset == null) {
      return null;
    }
    const isHorizontal = dismissDirection === 'left' || dismissDirection === 'right';
    const transform = (0, _getElementTransform.getElementTransform)(popupElement);
    const transformOffset = isHorizontal ? transform.x : transform.y;
    if (Number.isFinite(transformOffset) && Math.abs(transformOffset) > 0.5) {
      return Math.min(offset, Math.abs(transformOffset));
    }
    return offset;
  }
  function resolveSwipeOpenThreshold() {
    const popupSize = resolvePopupSize();
    if (popupSize == null) {
      return FALLBACK_SWIPE_OPEN_THRESHOLD;
    }
    return popupSize * DEFAULT_SWIPE_OPEN_RATIO;
  }
  function applySwipeMovement() {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }
    if (!store.select('open') || !store.select('mounted')) {
      return;
    }
    if (closedOffsetRef.current == null) {
      closedOffsetRef.current = resolveClosedOffset(popupElement);
    }
    const closedOffset = closedOffsetRef.current;
    if (closedOffset === null) {
      return;
    }
    const {
      x,
      y
    } = dragDeltaRef.current;
    const displacement = (0, _useSwipeDismiss.getDisplacement)(resolvedSwipeDirection, x, y);
    const clampedDisplacement = Math.max(0, displacement);
    const dampedDisplacement = clampedDisplacement > closedOffset ? closedOffset + Math.sqrt(clampedDisplacement - closedOffset) : clampedDisplacement;
    const remaining = closedOffset - dampedDisplacement;
    const directionSign = dismissDirection === 'left' || dismissDirection === 'up' ? -1 : 1;
    const movement = remaining * directionSign;
    const isHorizontal = dismissDirection === 'left' || dismissDirection === 'right';
    const movementX = isHorizontal ? movement : 0;
    const movementY = isHorizontal ? 0 : movement;
    const openProgress = Math.max(0, Math.min(1, clampedDisplacement / closedOffset));
    const backdropProgress = Math.max(0, Math.min(1, 1 - openProgress));
    popupElement.style.setProperty(DrawerPopupCssVars.swipeMovementX, `${movementX}px`);
    popupElement.style.setProperty(DrawerPopupCssVars.swipeMovementY, `${movementY}px`);
    popupElement.setAttribute(DrawerPopupDataAttributes.swiping, '');
    swipePopupElementRef.current = popupElement;
    if (popupTransitionRef.current === null) {
      popupTransitionRef.current = popupElement.style.transition;
    }
    popupElement.style.transition = 'none';
    const backdropElement = store.context.backdropRef.current;
    if (backdropElement) {
      backdropElement.setAttribute(DrawerPopupDataAttributes.swiping, '');
      swipeBackdropElementRef.current = backdropElement;
      backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${backdropProgress}`);
      if (openProgress > 0 && frontmostHeight > 0) {
        backdropElement.style.setProperty(DrawerPopupCssVars.height, `${frontmostHeight}px`);
      } else {
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
      }
    }
    providerContext?.visualStateStore.set({
      swipeProgress: openProgress,
      frontmostHeight: openProgress > 0 ? frontmostHeight : 0
    });
    appliedSwipeStylesRef.current = true;
    swipeAreaActiveRef.current = true;
  }
  const clearSwipeStyles = (0, _useStableCallback.useStableCallback)(() => {
    const popupElement = swipePopupElementRef.current;
    if (popupElement) {
      popupElement.style.removeProperty(DrawerPopupCssVars.swipeMovementX);
      popupElement.style.removeProperty(DrawerPopupCssVars.swipeMovementY);
      popupElement.removeAttribute(DrawerPopupDataAttributes.swiping);
    }
    if (popupElement && popupTransitionRef.current !== null) {
      popupElement.style.transition = popupTransitionRef.current;
      popupTransitionRef.current = null;
    }
    const backdropElement = swipeBackdropElementRef.current;
    if (backdropElement) {
      backdropElement.removeAttribute(DrawerPopupDataAttributes.swiping);
      backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      backdropElement.style.removeProperty(DrawerPopupCssVars.height);
    }
    providerContext?.visualStateStore.set({
      swipeProgress: 0,
      frontmostHeight: 0
    });
    appliedSwipeStylesRef.current = false;
    swipePopupElementRef.current = null;
    swipeBackdropElementRef.current = null;
    swipeAreaActiveRef.current = false;
  });
  function openDrawer(event) {
    openedBySwipeRef.current = true;
    store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.swipe, event, swipeAreaRef.current));
  }
  function closeDrawer(event) {
    store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.swipe, event, swipeAreaRef.current));
  }
  function resetSwipeInteractionState() {
    swipeStartEventRef.current = null;
    openedBySwipeRef.current = false;
    closedOffsetRef.current = null;
    setSwipeActive(false);
  }
  function finishSwipeInteraction() {
    resetSwipeInteractionState();
    enableDismissAfterRelease();
    resetDragDelta();
    clearSwipeStyles();
  }
  const swipe = (0, _useSwipeDismiss.useSwipeDismiss)({
    enabled,
    directions: [resolvedSwipeDirection],
    elementRef: swipeAreaRef,
    trackDrag: false,
    movementCssVars: {
      x: DrawerPopupCssVars.swipeMovementX,
      y: DrawerPopupCssVars.swipeMovementY
    },
    onSwipeStart(event) {
      disableDismissForSwipe();
      swipeStartEventRef.current = event;
      openedBySwipeRef.current = false;
      setSwipeActive(true);
      resetDragDelta();
    },
    onProgress(_progress, details) {
      if (!details) {
        return;
      }
      if (!swipeStartEventRef.current) {
        return;
      }
      dragDeltaRef.current.x = details.deltaX;
      dragDeltaRef.current.y = details.deltaY;
      if (details.direction !== resolvedSwipeDirection) {
        return;
      }
      const displacement = (0, _useSwipeDismiss.getDisplacement)(resolvedSwipeDirection, details.deltaX, details.deltaY);
      if (!openedBySwipeRef.current && displacement < MIN_SWIPE_START_DISTANCE) {
        return;
      }
      if (!openedBySwipeRef.current && !store.select('open')) {
        openDrawer(swipeStartEventRef.current);
      }
      applySwipeMovement();
    },
    onRelease({
      event,
      direction,
      deltaX,
      deltaY,
      releaseVelocityX,
      releaseVelocityY
    }) {
      const displacement = (0, _useSwipeDismiss.getDisplacement)(resolvedSwipeDirection, deltaX, deltaY);
      const releaseVelocity = (0, _useSwipeDismiss.getDisplacement)(resolvedSwipeDirection, releaseVelocityX, releaseVelocityY);
      const threshold = resolveSwipeOpenThreshold();
      const hasEnoughDistance = displacement >= threshold;
      const hasEnoughVelocity = releaseVelocity >= VELOCITY_THRESHOLD;
      const shouldOpen = direction === resolvedSwipeDirection && (hasEnoughDistance || hasEnoughVelocity) && !disabled;
      if (shouldOpen) {
        if (!store.select('open')) {
          openDrawer(event);
        }
      } else if (openedBySwipeRef.current && store.select('open')) {
        closeDrawer(event);
      }
      finishSwipeInteraction();
      return false;
    },
    onCancel: finishSwipeInteraction
  });
  const swipePointerProps = swipe.getPointerProps();
  const swipeTouchProps = swipe.getTouchProps();
  const resetSwipe = swipe.reset;

  // The commit that opens the drawer re-renders the popup, resetting `--swipe-movement-*` to `0px`
  // (the viewport isn't swiping). Re-assert after the DOM mutation but before paint. No deps: must
  // run on every commit the swipe area participates in.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (swipeActive && appliedSwipeStylesRef.current) {
      applySwipeMovement();
    }
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled) {
      if (swipeActive) {
        enableDismissAfterRelease();
      }
      resetSwipe();
      resetDragDelta();
      clearSwipeStyles();
      resetSwipeInteractionState();
    }
  }, [clearSwipeStyles, enableDismissAfterRelease, enabled, resetDragDelta, resetSwipe, swipeActive]);
  React.useEffect(() => {
    return () => {
      releaseGuardCleanupRef.current();
      store.context.outsidePressEnabledRef.current = true;
    };
  }, [store]);
  const state = {
    open,
    swiping: swipe.swiping,
    swipeDirection: resolvedSwipeDirection,
    disabled
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, swipeAreaRef, registerTrigger],
    stateAttributesMapping,
    props: [{
      role: 'presentation',
      'aria-hidden': true,
      style: {
        pointerEvents: !enabled ? 'none' : undefined,
        touchAction: resolveTouchAction(resolvedSwipeDirection)
      },
      onPointerDown(event) {
        if (event.pointerType === 'touch') {
          return;
        }
        swipePointerProps.onPointerDown?.(event);

        // Prevent native text selection/drag gestures from competing with swipe-open dragging.
        if (event.cancelable) {
          event.preventDefault();
        }
      },
      onPointerMove(event) {
        if (event.pointerType === 'touch') {
          return;
        }
        swipePointerProps.onPointerMove?.(event);
      },
      onPointerUp(event) {
        if (event.pointerType === 'touch') {
          return;
        }
        swipePointerProps.onPointerUp?.(event);
      },
      onPointerCancel(event) {
        if (event.pointerType === 'touch') {
          return;
        }
        swipePointerProps.onPointerCancel?.(event);
      }
    }, swipeTouchProps, swipeAreaId ? {
      id: swipeAreaId
    } : undefined, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DrawerSwipeArea.displayName = "DrawerSwipeArea";