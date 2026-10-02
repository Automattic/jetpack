"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useHoverReferenceInteraction = useHoverReferenceInteraction;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _mergeCleanups = require("@base-ui/utils/mergeCleanups");
var _owner = require("@base-ui/utils/owner");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _dom = require("@floating-ui/utils/dom");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _FloatingTree = require("../components/FloatingTree");
var _element = require("../utils/element");
var _event = require("../utils/event");
var _useHoverInteractionSharedState = require("./useHoverInteractionSharedState");
var _useHoverShared = require("./useHoverShared");
const EMPTY_REF = {
  current: null
};

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
function useHoverReferenceInteraction(context, props = {}) {
  const {
    enabled = true,
    delay = 0,
    handleClose = null,
    mouseOnly = false,
    restMs = 0,
    move = true,
    triggerElementRef = EMPTY_REF,
    externalTree,
    isActiveTrigger = true,
    getHandleCloseContext,
    isClosing,
    shouldOpen: shouldOpenProp,
    guardStaleOpen = false
  } = props;
  const store = 'rootStore' in context ? context.rootStore : context;
  const {
    dataRef,
    events
  } = store.context;
  const tree = (0, _FloatingTree.useFloatingTree)(externalTree);
  const instance = (0, _useHoverInteractionSharedState.useHoverInteractionSharedState)(store);
  const isHoverCloseActiveRef = React.useRef(false);
  const handleCloseRef = (0, _useValueAsRef.useValueAsRef)(handleClose);
  const delayRef = (0, _useValueAsRef.useValueAsRef)(delay);
  const restMsRef = (0, _useValueAsRef.useValueAsRef)(restMs);
  const enabledRef = (0, _useValueAsRef.useValueAsRef)(enabled);
  const shouldOpenRef = (0, _useValueAsRef.useValueAsRef)(shouldOpenProp);
  const isClosingRef = (0, _useValueAsRef.useValueAsRef)(isClosing);
  const isClickLikeOpenEvent = (0, _useStableCallback.useStableCallback)(() => {
    return (0, _useHoverShared.isClickLikeOpenEvent)(dataRef.current.openEvent?.type, instance.interactedInside);
  });
  const checkShouldOpen = (0, _useStableCallback.useStableCallback)(() => {
    return shouldOpenRef.current?.() !== false;
  });
  const isOverInactiveTrigger = (0, _useStableCallback.useStableCallback)((currentDomReference, currentTarget, target) => {
    const allTriggers = store.context.triggerElements;

    // Fast path for normal usage where handlers are attached directly to triggers.
    if (allTriggers.hasElement(currentTarget)) {
      return !currentDomReference || !(0, _element.contains)(currentDomReference, currentTarget);
    }

    // Fallback for delegated/wrapper usage where currentTarget may be outside the trigger map.
    if (!(0, _dom.isElement)(target)) {
      return false;
    }
    const targetElement = target;
    return allTriggers.hasMatchingElement(trigger => (0, _element.contains)(trigger, targetElement)) && (!currentDomReference || !(0, _element.contains)(currentDomReference, targetElement));
  });
  const cleanupMouseMoveHandler = (0, _useStableCallback.useStableCallback)(() => {
    if (!instance.handler) {
      return;
    }
    const doc = (0, _owner.ownerDocument)(store.select('domReferenceElement'));
    doc.removeEventListener('mousemove', instance.handler);
    instance.handler = undefined;
  });
  const clearPointerEvents = (0, _useStableCallback.useStableCallback)(() => {
    (0, _useHoverInteractionSharedState.clearSafePolygonPointerEventsMutation)(instance);
  });
  if (isActiveTrigger) {
    // eslint-disable-next-line no-underscore-dangle
    instance.handleCloseOptions = handleClose?.__options;
  }
  React.useEffect(() => cleanupMouseMoveHandler, [cleanupMouseMoveHandler]);

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function onOpenChangeLocal(details) {
      if (!details.open) {
        isHoverCloseActiveRef.current = details.reason === _reasons.REASONS.triggerHover;
        cleanupMouseMoveHandler();
        instance.openChangeTimeout.clear();
        instance.restTimeout.clear();
        instance.blockMouseMove = true;
        instance.restTimeoutPending = false;
      } else {
        isHoverCloseActiveRef.current = false;
      }
    }
    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [enabled, events, instance, cleanupMouseMoveHandler]);
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function closeWithDelay(event, runElseBranch = true) {
      const closeDelay = (0, _useHoverShared.getDelay)(delayRef.current, 'close', instance.pointerType);
      if (closeDelay) {
        instance.openChangeTimeout.start(closeDelay, () => {
          store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event));
          tree?.events.emit('floating.closed', event);
        });
      } else if (runElseBranch) {
        instance.openChangeTimeout.clear();
        store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event));
        tree?.events.emit('floating.closed', event);
      }
    }
    const trigger = triggerElementRef.current ?? (isActiveTrigger ? store.select('domReferenceElement') : null);
    if (!(0, _dom.isElement)(trigger)) {
      return undefined;
    }
    function onMouseEnter(event) {
      instance.openChangeTimeout.clear();
      instance.blockMouseMove = false;
      if (mouseOnly && !(0, _event.isMouseLikePointerType)(instance.pointerType)) {
        return;
      }

      // Only rest delay is set; there's no fallback delay.
      // This will be handled by `onMouseMove`.
      const restMsValue = (0, _useHoverShared.getRestMs)(restMsRef.current);
      const openDelay = (0, _useHoverShared.getDelay)(delayRef.current, 'open', instance.pointerType);
      const eventTarget = (0, _element.getTarget)(event);
      const currentTarget = event.currentTarget ?? null;
      const currentDomReference = store.select('domReferenceElement');
      let triggerNode = currentTarget;

      // Wrapper/delegated mode: resolve the actual trigger from the event target.
      if ((0, _dom.isElement)(eventTarget) && !store.context.triggerElements.hasElement(eventTarget)) {
        for (const triggerElement of store.context.triggerElements.elements()) {
          if ((0, _element.contains)(triggerElement, eventTarget)) {
            triggerNode = triggerElement;
            break;
          }
        }
      }

      // Wrapper/delegated mode fallback: if the wrapper contains the active trigger,
      // treat this as re-entering that active trigger.
      if ((0, _dom.isElement)(currentTarget) && (0, _dom.isElement)(currentDomReference) && !store.context.triggerElements.hasElement(currentTarget) && (0, _element.contains)(currentTarget, currentDomReference)) {
        triggerNode = currentDomReference;
      }
      const isOverInactive = triggerNode == null ? false : isOverInactiveTrigger(currentDomReference, triggerNode, eventTarget);
      const isOpen = store.select('open');
      const isInClosingTransition = isClosingRef.current?.() ?? store.select('transitionStatus') === 'ending';
      const isHoverCloseTransition = !isOpen && isInClosingTransition && isHoverCloseActiveRef.current;
      const isReenteringSameTriggerDuringCloseTransition = !isOverInactive && (0, _dom.isElement)(triggerNode) && (0, _dom.isElement)(currentDomReference) && (0, _element.contains)(currentDomReference, triggerNode) && isHoverCloseTransition;
      const isRestOnlyDelay = restMsValue > 0 && !openDelay;
      const shouldOpenImmediately = isOverInactive && (isOpen || isHoverCloseTransition) || isReenteringSameTriggerDuringCloseTransition;
      const shouldOpen = !isOpen || isOverInactive;

      // Open immediately when moving between triggers while open, or during
      // a hover-driven close transition (including same-trigger re-entry).
      if (shouldOpenImmediately) {
        if (checkShouldOpen()) {
          store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event, triggerNode));
        }
        return;
      }
      if (isRestOnlyDelay) {
        return;
      }
      if (openDelay) {
        instance.openChangeTimeout.start(openDelay, () => {
          if (shouldOpen && checkShouldOpen()) {
            store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event, triggerNode));
          }
        });
      } else if (shouldOpen) {
        if (checkShouldOpen()) {
          store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event, triggerNode));
        }
      }
    }
    function onMouseLeave(event) {
      if (isClickLikeOpenEvent()) {
        clearPointerEvents();
        return;
      }
      cleanupMouseMoveHandler();
      const domReferenceElement = store.select('domReferenceElement');
      const doc = (0, _owner.ownerDocument)(domReferenceElement);
      instance.restTimeout.clear();
      instance.restTimeoutPending = false;
      const handleCloseContextBase = dataRef.current.floatingContext ?? getHandleCloseContext?.();
      if ((0, _useHoverShared.isInsideEnabledTrigger)(event.relatedTarget, store.context.triggerElements)) {
        return;
      }
      if (handleCloseRef.current && handleCloseContextBase) {
        if (!store.select('open')) {
          instance.openChangeTimeout.clear();
        }
        const currentTrigger = triggerElementRef.current;
        instance.handler = handleCloseRef.current({
          ...handleCloseContextBase,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (enabledRef.current && !isClickLikeOpenEvent() && currentTrigger === store.select('domReferenceElement')) {
              closeWithDelay(event, true);
            }
          }
        });
        doc.addEventListener('mousemove', instance.handler);
        instance.handler(event);
        return;
      }
      const shouldClose = instance.pointerType === 'touch' ? !(0, _element.contains)(store.select('floatingElement'), event.relatedTarget) : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }

    // Backup cancellation for Chrome's dropped `mouseleave` — see `guardStaleOpen`.
    function onMouseOut(event) {
      if ((0, _element.contains)(trigger, event.relatedTarget)) {
        return; // moved within the trigger's own subtree
      }
      instance.openChangeTimeout.clear();
      instance.restTimeout.clear();
      instance.restTimeoutPending = false;
    }
    const staleOpenGuard = guardStaleOpen ? (0, _addEventListener.addEventListener)(trigger, 'mouseout', onMouseOut) : undefined;
    if (move) {
      return (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(trigger, 'mousemove', onMouseEnter, {
        once: true
      }), (0, _addEventListener.addEventListener)(trigger, 'mouseenter', onMouseEnter), (0, _addEventListener.addEventListener)(trigger, 'mouseleave', onMouseLeave), staleOpenGuard);
    }
    return (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(trigger, 'mouseenter', onMouseEnter), (0, _addEventListener.addEventListener)(trigger, 'mouseleave', onMouseLeave), staleOpenGuard);
  }, [cleanupMouseMoveHandler, clearPointerEvents, dataRef, delayRef, store, enabled, handleCloseRef, instance, isActiveTrigger, isOverInactiveTrigger, isClickLikeOpenEvent, mouseOnly, move, restMsRef, triggerElementRef, tree, enabledRef, getHandleCloseContext, isClosingRef, checkShouldOpen, guardStaleOpen]);
  return React.useMemo(() => {
    if (!enabled) {
      return undefined;
    }
    function setPointerRef(event) {
      instance.pointerType = event.pointerType;
    }
    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        const {
          nativeEvent
        } = event;
        const trigger = event.currentTarget;
        const currentDomReference = store.select('domReferenceElement');
        const currentOpen = store.select('open');
        const isOverInactive = isOverInactiveTrigger(currentDomReference, trigger, event.target);
        if (mouseOnly && !(0, _event.isMouseLikePointerType)(instance.pointerType)) {
          return;
        }
        if (currentOpen && isOverInactive && instance.handleCloseOptions?.blockPointerEvents) {
          const floatingElement = store.select('floatingElement');
          if (floatingElement) {
            const scopeElement = instance.handleCloseOptions?.getScope?.() ?? trigger.ownerDocument.body;
            (0, _useHoverInteractionSharedState.applySafePolygonPointerEventsMutation)(instance, {
              scopeElement,
              referenceElement: trigger,
              floatingElement
            });
          }
        }
        const restMsValue = (0, _useHoverShared.getRestMs)(restMsRef.current);
        if (currentOpen && !isOverInactive || restMsValue === 0) {
          return;
        }
        if (!isOverInactive && instance.restTimeoutPending && event.movementX ** 2 + event.movementY ** 2 < 2) {
          return;
        }
        instance.restTimeout.clear();
        function handleMouseMove() {
          instance.restTimeoutPending = false;

          // A delayed hover open should not override a click-like open that happened
          // while the hover delay was pending.
          if (isClickLikeOpenEvent()) {
            return;
          }
          const latestOpen = store.select('open');
          if (!instance.blockMouseMove && (!latestOpen || isOverInactive) && checkShouldOpen()) {
            store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, nativeEvent, trigger));
          }
        }
        if (instance.pointerType === 'touch') {
          ReactDOM.flushSync(() => {
            handleMouseMove();
          });
        } else if (isOverInactive && currentOpen) {
          handleMouseMove();
        } else {
          instance.restTimeoutPending = true;
          instance.restTimeout.start(restMsValue, handleMouseMove);
        }
      }
    };
  }, [enabled, instance, isClickLikeOpenEvent, isOverInactiveTrigger, mouseOnly, store, restMsRef, checkShouldOpen]);
}