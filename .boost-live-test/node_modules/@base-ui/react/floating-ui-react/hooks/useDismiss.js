"use strict";
'use client';

/* eslint-disable no-underscore-dangle */
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalizeProp = normalizeProp;
exports.useDismiss = useDismiss;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _mergeCleanups = require("@base-ui/utils/mergeCleanups");
var _owner = require("@base-ui/utils/owner");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _dom = require("@floating-ui/utils/dom");
var _platform = require("@base-ui/utils/platform");
var _FloatingTree = require("../components/FloatingTree");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _createAttribute = require("../utils/createAttribute");
var _element = require("../utils/element");
var _event = require("../utils/event");
var _nodes = require("../utils/nodes");
function alwaysFalse() {
  return false;
}
function normalizeProp(normalizable) {
  return {
    escapeKey: typeof normalizable === 'boolean' ? normalizable : normalizable?.escapeKey ?? false,
    outsidePress: typeof normalizable === 'boolean' ? normalizable : normalizable?.outsidePress ?? true
  };
}
/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
function useDismiss(context, props = {}) {
  const {
    enabled = true,
    escapeKey = true,
    outsidePress: outsidePressProp = true,
    outsidePressEvent = 'sloppy',
    referencePress = alwaysFalse,
    bubbles,
    externalTree
  } = props;
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const {
    dataRef,
    events
  } = store.context;
  const tree = (0, _FloatingTree.useFloatingTree)(externalTree);
  const outsidePressFn = (0, _useStableCallback.useStableCallback)(typeof outsidePressProp === 'function' ? outsidePressProp : () => false);
  const outsidePress = typeof outsidePressProp === 'function' ? outsidePressFn : outsidePressProp;
  const outsidePressEnabled = outsidePress !== false;
  const getOutsidePressEventProp = (0, _useStableCallback.useStableCallback)(() => outsidePressEvent);
  const {
    escapeKey: escapeKeyBubbles,
    outsidePress: outsidePressBubbles
  } = normalizeProp(bubbles);
  const pressStartedInsideRef = React.useRef(false);
  const pressStartPreventedRef = React.useRef(false);
  // Ignore only the very next outside click after dragging from inside to outside.
  const suppressNextOutsideClickRef = React.useRef(false);
  // A click whose press began before the floating element opened is the tail of that
  // gesture (e.g. the drag-release that opened it), not a new outside press.
  const sawPressWhileOpenRef = React.useRef(false);
  const isComposingRef = React.useRef(false);
  const currentPointerTypeRef = React.useRef('');
  const touchStateRef = React.useRef(null);
  const cancelDismissOnEndTimeout = (0, _useTimeout.useTimeout)();
  const clearInsideReactTreeTimeout = (0, _useTimeout.useTimeout)();
  const clearInsideReactTree = (0, _useStableCallback.useStableCallback)(() => {
    clearInsideReactTreeTimeout.clear();
    dataRef.current.insideReactTree = false;
  });
  const hasBlockingChild = (0, _useStableCallback.useStableCallback)(bubbleKey => {
    const nodeId = dataRef.current.floatingContext?.nodeId;
    const children = tree ? (0, _nodes.getNodeChildren)(tree.nodesRef.current, nodeId) : [];
    return children.some(child => child.context?.open && !child.context.dataRef.current[bubbleKey]);
  });
  const isEventWithinOwnElements = (0, _useStableCallback.useStableCallback)(event => {
    return (0, _element.isEventTargetWithin)(event, store.select('floatingElement')) || (0, _element.isEventTargetWithin)(event, store.select('domReferenceElement'));
  });
  const closeOnReferencePress = (0, _useStableCallback.useStableCallback)(event => {
    if (!referencePress()) {
      return;
    }
    store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerPress, event.nativeEvent));
  });
  const closeOnEscapeKeyDown = (0, _useStableCallback.useStableCallback)(event => {
    if (!open || !enabled || !escapeKey || event.key !== 'Escape') {
      return;
    }

    // Wait until IME is settled. Pressing `Escape` while composing should
    // close the compose menu, but not the floating element.
    if (isComposingRef.current) {
      return;
    }
    if (!escapeKeyBubbles && hasBlockingChild('__escapeKeyBubbles')) {
      return;
    }
    const native = (0, _event.isReactEvent)(event) ? event.nativeEvent : event;
    const eventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.escapeKey, native);
    store.setOpen(false, eventDetails);
    if (!eventDetails.isCanceled) {
      event.preventDefault();
    }
    if (!escapeKeyBubbles && !eventDetails.isPropagationAllowed) {
      event.stopPropagation();
    }
  });
  const markInsideReactTree = (0, _useStableCallback.useStableCallback)(() => {
    dataRef.current.insideReactTree = true;
    clearInsideReactTreeTimeout.start(0, clearInsideReactTree);
  });
  const markPressStartedInsideReactTree = (0, _useStableCallback.useStableCallback)(event => {
    if (!open || !enabled || event.button !== 0) {
      return;
    }
    const target = (0, _element.getTarget)(event.nativeEvent);

    // Only treat presses that start within the floating DOM subtree as inside.
    // This avoids suppressing parent dismissal when interacting with nested portals.
    if (!(0, _element.contains)(store.select('floatingElement'), target)) {
      return;
    }
    if (!pressStartedInsideRef.current) {
      pressStartedInsideRef.current = true;
      pressStartPreventedRef.current = false;
    }
  });
  const markInsidePressStartPrevented = (0, _useStableCallback.useStableCallback)(event => {
    if (!open || !enabled) {
      return;
    }
    if (!(event.defaultPrevented || event.nativeEvent.defaultPrevented)) {
      return;
    }
    if (pressStartedInsideRef.current) {
      pressStartPreventedRef.current = true;
    }
  });

  // A same-batch close+reopen never renders `open === false`, so only `openchange` can
  // observe that session boundary. The effect below covers controlled flips.
  React.useEffect(() => {
    function handleOpenChange(details) {
      // Only the closing half ends the session: `setOpen(true)` on an already-open
      // element (hovering an inactive trigger) must not drop a press mid-gesture.
      if (!details.open) {
        sawPressWhileOpenRef.current = false;
      }
    }
    events.on('openchange', handleOpenChange);
    return () => {
      events.off('openchange', handleOpenChange);
    };
  }, [events]);
  React.useEffect(() => {
    if (!open || !enabled) {
      // Reset in the effect body, not the cleanup, which also runs when a dependency
      // changes mid-gesture.
      if (!open) {
        sawPressWhileOpenRef.current = false;
      }
      return clearInsideReactTree;
    }
    dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
    dataRef.current.__outsidePressBubbles = outsidePressBubbles;
    const compositionTimeout = new _useTimeout.Timeout();
    const preventedPressSuppressionTimeout = new _useTimeout.Timeout();
    const doc = (0, _owner.ownerDocument)(floatingElement);
    function handleCompositionStart() {
      compositionTimeout.clear();
      isComposingRef.current = true;
    }
    function handleCompositionEnd() {
      // Safari fires `compositionend` before `keydown`, so we need to wait
      // until the next tick to set `isComposing` to `false`.
      // https://bugs.webkit.org/show_bug.cgi?id=165004
      compositionTimeout.start(
      // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
      // Only apply to WebKit for the test to remain 0ms.
      _platform.platform.engine.webkit ? 5 : 0, () => {
        isComposingRef.current = false;
      });
    }
    function suppressImmediateOutsideClickAfterPreventedStart() {
      suppressNextOutsideClickRef.current = true;
      // Firefox can emit the synthetic outside click in a later task after
      // pointer lock exit, so microtask clearing is too early here.
      preventedPressSuppressionTimeout.start(0, () => {
        suppressNextOutsideClickRef.current = false;
      });
    }
    function resetPressStartState() {
      pressStartedInsideRef.current = false;
      pressStartPreventedRef.current = false;
    }
    function getOutsidePressEvent() {
      const type = currentPointerTypeRef.current;
      const computedType = type === 'pen' || !type ? 'mouse' : type;
      const outsidePressEventValue = getOutsidePressEventProp();
      const resolved = typeof outsidePressEventValue === 'function' ? outsidePressEventValue() : outsidePressEventValue;
      if (typeof resolved === 'string') {
        return resolved;
      }
      return resolved[computedType];
    }
    function shouldIgnoreEvent(event) {
      const computedOutsidePressEvent = getOutsidePressEvent();
      return computedOutsidePressEvent === 'intentional' && event.type !== 'click' || computedOutsidePressEvent === 'sloppy' && event.type === 'click';
    }
    function isEventWithinFloatingTree(event) {
      const nodeId = dataRef.current.floatingContext?.nodeId;
      const targetIsInsideChildren = tree && (0, _nodes.getNodeChildren)(tree.nodesRef.current, nodeId).some(node => (0, _element.isEventTargetWithin)(event, node.context?.elements.floating));
      return isEventWithinOwnElements(event) || targetIsInsideChildren;
    }
    function closeOnPressOutside(event) {
      if (shouldIgnoreEvent(event)) {
        // A new press began outside the floating element and its trigger. Clear any
        // leftover drag-out suppression so this press's eventual click can dismiss.
        if (event.type !== 'click' && !isEventWithinOwnElements(event)) {
          preventedPressSuppressionTimeout.clear();
          suppressNextOutsideClickRef.current = false;
        }
        clearInsideReactTree();
        return;
      }
      if (dataRef.current.insideReactTree) {
        clearInsideReactTree();
        return;
      }
      const target = (0, _element.getTarget)(event);
      const inertSelector = `[${(0, _createAttribute.createAttribute)('inert')}]`;
      const targetRoot = (0, _dom.isElement)(target) ? target.getRootNode() : null;
      const markers = Array.from(((0, _dom.isShadowRoot)(targetRoot) ? targetRoot : (0, _owner.ownerDocument)(store.select('floatingElement'))).querySelectorAll(inertSelector));
      const triggers = store.context.triggerElements;

      // If another trigger is clicked, don't close the floating element.
      if (target && (triggers.hasElement(target) || triggers.hasMatchingElement(trigger => (0, _element.contains)(trigger, target)))) {
        return;
      }
      let targetRootAncestor = (0, _dom.isElement)(target) ? target : null;
      while (targetRootAncestor && !(0, _dom.isLastTraversableNode)(targetRootAncestor)) {
        const nextParent = (0, _dom.getParentNode)(targetRootAncestor);
        if ((0, _dom.isLastTraversableNode)(nextParent) || !(0, _dom.isElement)(nextParent)) {
          break;
        }
        targetRootAncestor = nextParent;
      }

      // Check if the click occurred on a third-party element injected after the
      // floating element rendered.
      if (markers.length && (0, _dom.isElement)(target) && !(0, _element.isRootElement)(target) &&
      // Clicked on a direct ancestor (e.g. FloatingOverlay).
      !(0, _element.contains)(target, store.select('floatingElement')) &&
      // If the target root element contains none of the markers, then the
      // element was injected after the floating element rendered.
      markers.every(marker => !(0, _element.contains)(targetRootAncestor, marker))) {
        return;
      }

      // Check if the click occurred on the scrollbar
      // Skip for touch events: scrollbars don't receive touch events on most platforms
      if ((0, _dom.isHTMLElement)(target) && !('touches' in event)) {
        const lastTraversableNode = (0, _dom.isLastTraversableNode)(target);
        const style = (0, _dom.getComputedStyle)(target);
        const scrollRe = /auto|scroll/;
        const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
        const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);
        const canScrollX = isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
        const canScrollY = isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;
        const isRTL = style.direction === 'rtl';

        // Check click position relative to scrollbar.
        // In some browsers it is possible to change the <body> (or window)
        // scrollbar to the left side, but is very rare and is difficult to
        // check for. Plus, for modal dialogs with backdrops, it is more
        // important that the backdrop is checked but not so much the window.
        const pressedVerticalScrollbar = canScrollY && (isRTL ? event.offsetX <= target.offsetWidth - target.clientWidth : event.offsetX > target.clientWidth);
        const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;
        if (pressedVerticalScrollbar || pressedHorizontalScrollbar) {
          return;
        }
      }
      if (isEventWithinFloatingTree(event)) {
        return;
      }

      // Only `click` events reach this point in intentional mode.
      if (getOutsidePressEvent() === 'intentional') {
        // Press-less clicks (keyboard, assistive technology, `element.click()`) report no
        // click count; `isVirtualClick` also catches the ones that do.
        if (event.detail !== 0 && !(0, _event.isVirtualClick)(event) && !sawPressWhileOpenRef.current) {
          return;
        }

        // A press that starts inside and ends outside gets one suppressed
        // outside click. Run this after inside-target checks so inside clicks
        // don't consume the one-shot suppression.
        if (suppressNextOutsideClickRef.current) {
          preventedPressSuppressionTimeout.clear();
          suppressNextOutsideClickRef.current = false;
          return;
        }
      }
      if (typeof outsidePress === 'function' && !outsidePress(event)) {
        return;
      }
      if (hasBlockingChild('__outsidePressBubbles')) {
        return;
      }
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.outsidePress, event));
      clearInsideReactTree();
    }
    function handlePointerDown(event) {
      if (getOutsidePressEvent() !== 'sloppy' || event.pointerType === 'touch' || !store.select('open') || !enabled || isEventWithinOwnElements(event)) {
        return;
      }
      closeOnPressOutside(event);
    }
    function handleTouchStart(event) {
      if (getOutsidePressEvent() !== 'sloppy' || !store.select('open') || !enabled || isEventWithinOwnElements(event)) {
        return;
      }
      const touch = event.touches[0];
      if (touch) {
        touchStateRef.current = {
          startTime: Date.now(),
          startX: touch.clientX,
          startY: touch.clientY,
          dismissOnTouchEnd: false,
          dismissOnMouseDown: true
        };
        cancelDismissOnEndTimeout.start(1000, () => {
          if (touchStateRef.current) {
            touchStateRef.current.dismissOnTouchEnd = false;
            touchStateRef.current.dismissOnMouseDown = false;
          }
        });
      }
    }
    function addTargetEventListenerOnce(event, listener) {
      const target = (0, _element.getTarget)(event);
      if (!target) {
        return;
      }
      const unsubscribe = (0, _addEventListener.addEventListener)(target, event.type, () => {
        listener(event);
        unsubscribe();
      });
    }
    function handleTouchStartCapture(event) {
      currentPointerTypeRef.current = 'touch';
      addTargetEventListenerOnce(event, handleTouchStart);
    }
    function closeOnPressOutsideCapture(event) {
      cancelDismissOnEndTimeout.clear();

      // Only `pointerdown` marks a press; `mousedown` is its compatibility event, and
      // counting it would misattribute a gesture that started before open.
      if (event.type === 'pointerdown') {
        // Only a primary press can produce a `click`.
        if (event.button === 0) {
          sawPressWhileOpenRef.current = true;
        }
        currentPointerTypeRef.current = event.pointerType;
      }
      if (event.type === 'mousedown' && touchStateRef.current && !touchStateRef.current.dismissOnMouseDown) {
        return;
      }
      addTargetEventListenerOnce(event, targetEvent => {
        if (targetEvent.type === 'pointerdown') {
          handlePointerDown(targetEvent);
        } else {
          closeOnPressOutside(targetEvent);
        }
      });
    }
    function handlePressEndCapture(event) {
      // A cancelled gesture produces no click. Not cleared on `pointerup`: the click
      // fires after it and must still find the press.
      if (event.type === 'pointercancel') {
        sawPressWhileOpenRef.current = false;
      }
      if (!pressStartedInsideRef.current) {
        return;
      }
      const pressStartedInsideDefaultPrevented = pressStartPreventedRef.current;
      resetPressStartState();
      if (getOutsidePressEvent() !== 'intentional') {
        return;
      }
      if (event.type === 'pointercancel') {
        if (pressStartedInsideDefaultPrevented) {
          suppressImmediateOutsideClickAfterPreventedStart();
        }
        return;
      }
      if (isEventWithinFloatingTree(event)) {
        return;
      }

      // If pointerdown was prevented, no click may be generated for that
      // interaction. However, Firefox may still emit an immediate click after
      // pointerup (e.g. NumberField scrub with pointer lock), so suppress for
      // one tick to absorb that synthetic click only.
      if (pressStartedInsideDefaultPrevented) {
        suppressImmediateOutsideClickAfterPreventedStart();
        return;
      }

      // Avoid suppressing when outsidePress explicitly ignores this target.
      if (typeof outsidePress === 'function' && !outsidePress(event)) {
        return;
      }
      preventedPressSuppressionTimeout.clear();
      suppressNextOutsideClickRef.current = true;
      clearInsideReactTree();
    }
    function handleTouchMove(event) {
      if (getOutsidePressEvent() !== 'sloppy' || !touchStateRef.current || isEventWithinOwnElements(event)) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
      const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > 5) {
        touchStateRef.current.dismissOnTouchEnd = true;
      }
      if (distance > 10) {
        closeOnPressOutside(event);
        cancelDismissOnEndTimeout.clear();
        touchStateRef.current = null;
      }
    }
    function handleTouchMoveCapture(event) {
      addTargetEventListenerOnce(event, handleTouchMove);
    }
    function handleTouchEnd(event) {
      if (getOutsidePressEvent() !== 'sloppy' || !touchStateRef.current || isEventWithinOwnElements(event)) {
        return;
      }
      if (touchStateRef.current.dismissOnTouchEnd) {
        closeOnPressOutside(event);
      }
      cancelDismissOnEndTimeout.clear();
      touchStateRef.current = null;
    }
    function handleTouchEndCapture(event) {
      addTargetEventListenerOnce(event, handleTouchEnd);
    }
    const unsubscribe = (0, _mergeCleanups.mergeCleanups)(escapeKey && (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(doc, 'keydown', closeOnEscapeKeyDown), (0, _addEventListener.addEventListener)(doc, 'compositionstart', handleCompositionStart), (0, _addEventListener.addEventListener)(doc, 'compositionend', handleCompositionEnd)), outsidePressEnabled && (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(doc, 'click', closeOnPressOutsideCapture, true), (0, _addEventListener.addEventListener)(doc, 'pointerdown', closeOnPressOutsideCapture, true), (0, _addEventListener.addEventListener)(doc, 'pointerup', handlePressEndCapture, true), (0, _addEventListener.addEventListener)(doc, 'pointercancel', handlePressEndCapture, true), (0, _addEventListener.addEventListener)(doc, 'mousedown', closeOnPressOutsideCapture, true), (0, _addEventListener.addEventListener)(doc, 'mouseup', handlePressEndCapture, true), (0, _addEventListener.addEventListener)(doc, 'touchstart', handleTouchStartCapture, {
      capture: true,
      passive: true
    }), (0, _addEventListener.addEventListener)(doc, 'touchmove', handleTouchMoveCapture, {
      capture: true,
      passive: true
    }), (0, _addEventListener.addEventListener)(doc, 'touchend', handleTouchEndCapture, {
      capture: true,
      passive: true
    })));
    return () => {
      unsubscribe();
      compositionTimeout.clear();
      preventedPressSuppressionTimeout.clear();
      resetPressStartState();
      suppressNextOutsideClickRef.current = false;
      clearInsideReactTree();
    };
  }, [dataRef, floatingElement, escapeKey, outsidePressEnabled, outsidePress, open, enabled, escapeKeyBubbles, outsidePressBubbles, closeOnEscapeKeyDown, clearInsideReactTree, getOutsidePressEventProp, hasBlockingChild, isEventWithinOwnElements, tree, store, cancelDismissOnEndTimeout]);
  const reference = React.useMemo(() => ({
    onKeyDown: closeOnEscapeKeyDown,
    onPointerDown: closeOnReferencePress,
    onClick: closeOnReferencePress
  }), [closeOnEscapeKeyDown, closeOnReferencePress]);
  const floating = React.useMemo(() => ({
    onKeyDown: closeOnEscapeKeyDown,
    // `onMouseDown` may be blocked if `event.preventDefault()` is called in
    // `onPointerDown`, such as with <NumberField.ScrubArea>.
    // See https://github.com/mui/base-ui/pull/3379
    onPointerDown: markInsidePressStartPrevented,
    onMouseDown: markInsidePressStartPrevented,
    onClickCapture: markInsideReactTree,
    onMouseDownCapture(event) {
      markInsideReactTree();
      markPressStartedInsideReactTree(event);
    },
    onPointerDownCapture(event) {
      markInsideReactTree();
      markPressStartedInsideReactTree(event);
    },
    onMouseUpCapture: markInsideReactTree,
    onTouchEndCapture: markInsideReactTree,
    onTouchMoveCapture: markInsideReactTree
  }), [closeOnEscapeKeyDown, markInsideReactTree, markPressStartedInsideReactTree, markInsidePressStartPrevented]);
  return React.useMemo(() => enabled ? {
    reference,
    floating,
    trigger: reference
  } : {}, [enabled, reference, floating]);
}