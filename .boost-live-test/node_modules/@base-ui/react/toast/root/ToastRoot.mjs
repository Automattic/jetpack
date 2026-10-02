'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { activeElement, contains, getTarget } from "../../floating-ui-react/utils.mjs";
import { ToastRootContext } from "./ToastRootContext.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { useToastProviderContext } from "../provider/ToastProviderContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { BASE_UI_SWIPE_IGNORE_SELECTOR, LEGACY_SWIPE_IGNORE_SELECTOR } from "../../internals/constants.mjs";
import { getDisplacement } from "../../utils/useSwipeDismiss.mjs";
import { getElementTransform } from "../../utils/getElementTransform.mjs";
import * as ToastRootCssVars from "./ToastRootCssVars.mjs";
import * as ToastRootDataAttributes from "./ToastRootDataAttributes.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
export const toastRootStateAttributesMapping = {
  ...transitionStatusMapping,
  swipeDirection(value) {
    return value ? {
      [ToastRootDataAttributes.swipeDirection]: value
    } : null;
  }
};
const SWIPE_THRESHOLD = 40;
const REVERSE_CANCEL_THRESHOLD = 10;
const OPPOSITE_DIRECTION_DAMPING_FACTOR = 0.5;
const MIN_DRAG_THRESHOLD = 1;
const TOAST_SWIPE_IGNORE_SELECTOR = `${BASE_UI_SWIPE_IGNORE_SELECTOR},${LEGACY_SWIPE_IGNORE_SELECTOR}`;

/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastRoot = /*#__PURE__*/React.forwardRef(function ToastRoot(componentProps, forwardedRef) {
  const {
    toast,
    render,
    className,
    swipeDirection = ['down', 'right'],
    style,
    ...elementProps
  } = componentProps;
  const isAnchored = toast.positionerProps?.anchor !== undefined;
  let swipeDirections = [];
  if (!isAnchored) {
    swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];
  }
  const swipeEnabled = swipeDirections.length > 0;
  const store = useToastProviderContext();
  const [currentSwipeDirection, setCurrentSwipeDirection] = React.useState(undefined);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [isRealSwipe, setIsRealSwipe] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({
    x: 0,
    y: 0
  });
  const [initialTransform, setInitialTransform] = React.useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const [titleId, setTitleId] = React.useState();
  const [descriptionId, setDescriptionId] = React.useState();
  const [lockedDirection, setLockedDirection] = React.useState(null);
  const rootRef = React.useRef(null);
  const lastToastIdRef = React.useRef(undefined);
  const dragStartPosRef = React.useRef({
    x: 0,
    y: 0
  });
  const initialTransformRef = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  const intendedSwipeDirectionRef = React.useRef(undefined);
  const maxSwipeDisplacementRef = React.useRef(0);
  const cancelledSwipeRef = React.useRef(false);
  const swipeCancelBaselineRef = React.useRef({
    x: 0,
    y: 0
  });
  const isFirstPointerMoveRef = React.useRef(false);
  const dragOffsetRef = React.useRef({
    x: 0,
    y: 0
  });
  const activePointerIdRef = React.useRef(null);
  const dragAbortControllerRef = React.useRef(null);
  const domIndex = store.useState('toastIndex', toast.id);
  const visibleIndex = store.useState('toastVisibleIndex', toast.id);
  const offsetY = store.useState('toastOffsetY', toast.id);
  const focused = store.useState('focused');
  const expanded = store.useState('expanded');
  useOpenChangeComplete({
    open: toast.transitionStatus !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.transitionStatus === 'ending') {
        store.removeToast(toast.id);
      }
    }
  });

  // Recalculates the natural height of the toast and updates it in the toast manager.
  // `flushSync` avoids visual flickers when called from observer callbacks.
  // The store ignores this write while the toast is transitioning out.
  const recalculateHeight = useStableCallback((flushSync = false) => {
    const element = rootRef.current;
    if (!element) {
      return;
    }
    const previousHeight = element.style.height;
    element.style.height = 'auto';
    const height = element.offsetHeight;
    element.style.height = previousHeight;
    function update() {
      store.updateToastInternal(toast.id, {
        ref: rootRef,
        height,
        transitionStatus: undefined
      });
    }
    if (flushSync) {
      ReactDOM.flushSync(update);
    } else {
      update();
    }
  });

  // Initialize the toast on mount, and reinitialize when it begins a new lifecycle:
  // re-adding an ending toast retains the same root instance (`key={toast.id}`), and
  // index-keyed lists can hand an existing instance a different toast.
  useIsoLayoutEffect(() => {
    const previousToastId = lastToastIdRef.current;
    // `recalculateHeight` clears the `starting` status itself, so bail out on the
    // resulting re-run and on the later `ending` one, which the store discards anyway.
    if (toast.transitionStatus !== 'starting' && previousToastId === toast.id) {
      return;
    }
    if (previousToastId !== undefined) {
      // A retained root keeps component-local swipe state from its previous lifecycle;
      // clear it so the toast doesn't stay offset or exit in the swiped direction.
      setCurrentSwipeDirection(undefined);
      setInitialTransform({
        x: 0,
        y: 0,
        scale: 1
      });
      setResolvedDragOffset({
        x: 0,
        y: 0
      });
    }
    lastToastIdRef.current = toast.id;
    recalculateHeight();
  }, [recalculateHeight, toast.id, toast.transitionStatus]);
  function setResolvedDragOffset(nextDragOffset) {
    dragOffsetRef.current = nextDragOffset;
    setDragOffset(nextDragOffset);
  }
  useIsoLayoutEffect(() => {
    return () => {
      dragAbortControllerRef.current?.abort();
    };
  }, []);
  function applyDirectionalDamping(deltaX, deltaY) {
    const damp = delta => delta > 0 ? delta ** OPPOSITE_DIRECTION_DAMPING_FACTOR : -(Math.abs(delta) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    const dampX = deltaX > 0 && !swipeDirections.includes('right') || deltaX < 0 && !swipeDirections.includes('left');
    const dampY = deltaY > 0 && !swipeDirections.includes('down') || deltaY < 0 && !swipeDirections.includes('up');
    return {
      x: dampX ? damp(deltaX) : deltaX,
      y: dampY ? damp(deltaY) : deltaY
    };
  }
  const handleSwipeEnd = useStableCallback(event => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }
    activePointerIdRef.current = null;
    dragAbortControllerRef.current?.abort();
    dragAbortControllerRef.current = null;
    setIsSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);
    const resolvedInitialTransform = initialTransformRef.current;
    if (event.type === 'pointercancel' || cancelledSwipeRef.current) {
      setResolvedDragOffset({
        x: resolvedInitialTransform.x,
        y: resolvedInitialTransform.y
      });
      setCurrentSwipeDirection(undefined);
      return;
    }
    const resolvedDragOffset = dragOffsetRef.current;
    const deltaX = resolvedDragOffset.x - resolvedInitialTransform.x;
    const deltaY = resolvedDragOffset.y - resolvedInitialTransform.y;
    let dismissDirection;
    for (const direction of swipeDirections) {
      if (getDisplacement(direction, deltaX, deltaY) > SWIPE_THRESHOLD) {
        dismissDirection = direction;
        break;
      }
    }
    if (dismissDirection) {
      setCurrentSwipeDirection(dismissDirection);
      store.closeToast(toast.id);
    } else {
      setResolvedDragOffset({
        x: resolvedInitialTransform.x,
        y: resolvedInitialTransform.y
      });
      setCurrentSwipeDirection(undefined);
    }
  });
  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    if (event.pointerType === 'touch') {
      store.pauseTimers();
    }
    const target = getTarget(event.nativeEvent);
    const isInteractiveElement = target?.closest(`button,a,input,textarea,[role="button"],${TOAST_SWIPE_IGNORE_SELECTOR}`);
    if (isInteractiveElement) {
      return;
    }
    cancelledSwipeRef.current = false;
    intendedSwipeDirectionRef.current = undefined;
    maxSwipeDisplacementRef.current = 0;
    activePointerIdRef.current = event.pointerId;
    dragStartPosRef.current = {
      x: event.clientX,
      y: event.clientY
    };
    swipeCancelBaselineRef.current = dragStartPosRef.current;
    const element = event.currentTarget;
    const transform = getElementTransform(element);
    initialTransformRef.current = transform;
    setInitialTransform(transform);
    setResolvedDragOffset({
      x: transform.x,
      y: transform.y
    });
    store.set('hovering', true);
    setIsSwiping(true);
    setIsRealSwipe(false);
    setLockedDirection(null);
    isFirstPointerMoveRef.current = true;
    dragAbortControllerRef.current?.abort();
    const dragAbortController = new AbortController();
    dragAbortControllerRef.current = dragAbortController;
    const doc = ownerDocument(element);
    doc.addEventListener('pointerup', handleSwipeEnd, {
      signal: dragAbortController.signal
    });
    doc.addEventListener('pointercancel', handleSwipeEnd, {
      signal: dragAbortController.signal
    });
    element.setPointerCapture?.(event.pointerId);
  }
  function handlePointerMove(event) {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    // Prevent text selection on Safari
    event.preventDefault();
    if (isFirstPointerMoveRef.current) {
      // Adjust the starting position to the current position on the first move
      // to account for the delay between pointerdown and the first pointermove on iOS.
      dragStartPosRef.current = {
        x: event.clientX,
        y: event.clientY
      };
      isFirstPointerMoveRef.current = false;
    }
    const {
      clientY,
      clientX,
      movementX,
      movementY
    } = event;
    if (movementY < 0 && clientY > swipeCancelBaselineRef.current.y || movementY > 0 && clientY < swipeCancelBaselineRef.current.y) {
      swipeCancelBaselineRef.current = {
        x: swipeCancelBaselineRef.current.x,
        y: clientY
      };
    }
    if (movementX < 0 && clientX > swipeCancelBaselineRef.current.x || movementX > 0 && clientX < swipeCancelBaselineRef.current.x) {
      swipeCancelBaselineRef.current = {
        x: clientX,
        y: swipeCancelBaselineRef.current.y
      };
    }
    const deltaX = clientX - dragStartPosRef.current.x;
    const deltaY = clientY - dragStartPosRef.current.y;
    const cancelDeltaY = clientY - swipeCancelBaselineRef.current.y;
    const cancelDeltaX = clientX - swipeCancelBaselineRef.current.x;
    let resolvedLockedDirection = lockedDirection;
    if (!isRealSwipe) {
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementDistance >= MIN_DRAG_THRESHOLD) {
        setIsRealSwipe(true);
        // `lockedDirection` is always reset alongside `isRealSwipe`, so it is
        // still `null` here. Locking is only meaningful when both axes are
        // swipeable; otherwise the single axis already constrains the gesture.
        const hasHorizontal = swipeDirections.includes('left') || swipeDirections.includes('right');
        const hasVertical = swipeDirections.includes('up') || swipeDirections.includes('down');
        if (hasHorizontal && hasVertical) {
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          resolvedLockedDirection = absX > absY ? 'horizontal' : 'vertical';
          setLockedDirection(resolvedLockedDirection);
        }
      }
    }
    let candidate;
    if (!intendedSwipeDirectionRef.current) {
      if (resolvedLockedDirection === 'vertical') {
        if (deltaY > 0) {
          candidate = 'down';
        } else if (deltaY < 0) {
          candidate = 'up';
        }
      } else if (resolvedLockedDirection === 'horizontal') {
        if (deltaX > 0) {
          candidate = 'right';
        } else if (deltaX < 0) {
          candidate = 'left';
        }
      } else if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        candidate = deltaX > 0 ? 'right' : 'left';
      } else {
        candidate = deltaY > 0 ? 'down' : 'up';
      }
      if (candidate && swipeDirections.includes(candidate)) {
        intendedSwipeDirectionRef.current = candidate;
        maxSwipeDisplacementRef.current = getDisplacement(candidate, deltaX, deltaY);
        setCurrentSwipeDirection(candidate);
      }
    } else {
      const direction = intendedSwipeDirectionRef.current;
      const currentDisplacement = getDisplacement(direction, cancelDeltaX, cancelDeltaY);
      if (currentDisplacement > SWIPE_THRESHOLD) {
        cancelledSwipeRef.current = false;
        setCurrentSwipeDirection(direction);
      } else if (!(swipeDirections.includes('left') && swipeDirections.includes('right')) && !(swipeDirections.includes('up') && swipeDirections.includes('down')) && maxSwipeDisplacementRef.current - currentDisplacement >= REVERSE_CANCEL_THRESHOLD) {
        // Mark that a change-of-mind has occurred
        cancelledSwipeRef.current = true;
      }
    }
    const dampedDelta = applyDirectionalDamping(deltaX, deltaY);
    let newOffsetX = initialTransformRef.current.x;
    let newOffsetY = initialTransformRef.current.y;
    const hasHorizontalDir = swipeDirections.includes('left') || swipeDirections.includes('right');
    const hasVerticalDir = swipeDirections.includes('up') || swipeDirections.includes('down');
    if (resolvedLockedDirection !== 'vertical' && hasHorizontalDir) {
      newOffsetX += dampedDelta.x;
    }
    if (resolvedLockedDirection !== 'horizontal' && hasVerticalDir) {
      newOffsetY += dampedDelta.y;
    }
    setResolvedDragOffset({
      x: newOffsetX,
      y: newOffsetY
    });
  }
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (!rootRef.current || !contains(rootRef.current, activeElement(ownerDocument(rootRef.current)))) {
        return;
      }
      store.closeToast(toast.id);
    }
  }
  React.useEffect(() => {
    const element = rootRef.current;
    if (!swipeEnabled || !element) {
      return undefined;
    }
    function preventDefaultTouchStart(event) {
      if (activePointerIdRef.current === null || !contains(element, getTarget(event))) {
        return;
      }

      // React's pointermove preventDefault is not enough on iOS; this
      // non-passive touchmove listener blocks native scrolling while dragging.
      event.preventDefault();
    }
    return addEventListener(element, 'touchmove', preventDefaultTouchStart, {
      passive: false
    });
  }, [swipeEnabled]);
  function getDragStyles() {
    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;
    return {
      transition: isSwiping ? 'none' : undefined,
      // While swiping, freeze the element at its current visual transform so it doesn't snap to the
      // end position.
      transform: isSwiping ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) scale(${initialTransform.scale})` : undefined,
      [ToastRootCssVars.swipeMovementX]: `${deltaX}px`,
      [ToastRootCssVars.swipeMovementY]: `${deltaY}px`
    };
  }
  const isHighPriority = toast.priority === 'high';
  const defaultProps = {
    role: isHighPriority ? 'alertdialog' : 'dialog',
    tabIndex: 0,
    'aria-modal': false,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    'aria-hidden': isHighPriority && !focused ? true : undefined,
    onPointerDown: swipeEnabled ? handlePointerDown : undefined,
    onPointerMove: swipeEnabled ? handlePointerMove : undefined,
    onPointerUp: swipeEnabled ? handleSwipeEnd : undefined,
    onPointerCancel: swipeEnabled ? handleSwipeEnd : undefined,
    onKeyDown: handleKeyDown,
    inert: inertValue(toast.limited),
    style: {
      ...getDragStyles(),
      [ToastRootCssVars.index]: toast.transitionStatus === 'ending' ? domIndex : visibleIndex,
      [ToastRootCssVars.offsetY]: `${offsetY}px`,
      [ToastRootCssVars.height]: toast.height ? `${toast.height}px` : undefined
    }
  };
  const toastRoot = React.useMemo(() => ({
    toast,
    setTitleId,
    setDescriptionId,
    recalculateHeight,
    visibleIndex,
    expanded
  }), [toast, setTitleId, setDescriptionId, recalculateHeight, visibleIndex, expanded]);
  const state = {
    transitionStatus: toast.transitionStatus,
    expanded,
    limited: toast.limited || false,
    type: toast.type,
    swiping: isSwiping,
    swipeDirection: currentSwipeDirection
  };
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, rootRef],
    state,
    stateAttributesMapping: toastRootStateAttributesMapping,
    props: [defaultProps, elementProps]
  });
  return /*#__PURE__*/_jsx(ToastRootContext.Provider, {
    value: toastRoot,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ToastRoot.displayName = "ToastRoot";