"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useClick = useClick;
var React = _interopRequireWildcard(require("react"));
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _empty = require("@base-ui/utils/empty");
var _element = require("../utils/element");
var _event = require("../utils/event");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
/**
 * Opens or closes the floating element when clicking the reference element.
 * @see https://floating-ui.com/docs/useClick
 */
function useClick(context, props = {}) {
  const {
    enabled = true,
    event: eventOption = 'click',
    toggle = true,
    ignoreMouse = false,
    stickIfOpen = true,
    touchOpenDelay = 0,
    reason = _reasons.REASONS.triggerPress
  } = props;
  const store = 'rootStore' in context ? context.rootStore : context;
  const dataRef = store.context.dataRef;
  const pointerTypeRef = React.useRef(undefined);
  const frame = (0, _useAnimationFrame.useAnimationFrame)();
  const touchOpenTimeout = (0, _useTimeout.useTimeout)();
  const reference = React.useMemo(() => {
    function setOpenWithTouchDelay(nextOpen, nativeEvent, target, pointerType) {
      const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(reason, nativeEvent, target);
      if (nextOpen && pointerType === 'touch' && touchOpenDelay > 0) {
        touchOpenTimeout.start(touchOpenDelay, () => {
          store.setOpen(true, details);
        });
      } else {
        store.setOpen(nextOpen, details);
      }
    }
    function getNextOpen(open, currentTarget, isClickLikeOpenEvent) {
      const openEvent = dataRef.current.openEvent;
      const hasClickedOnInactiveTrigger = store.select('domReferenceElement') !== currentTarget;
      if (open && hasClickedOnInactiveTrigger) {
        // Moving between triggers should always open the newly active one.
        return true;
      }
      if (!open) {
        // A closed popup should open on the next press.
        return true;
      }
      if (!toggle) {
        // Non-toggle mode never closes on a repeated trigger press.
        return true;
      }
      if (openEvent && stickIfOpen) {
        // Preserve hover/focus-opened popups until the matching click-like event closes them.
        return !isClickLikeOpenEvent(openEvent.type);
      }

      // Otherwise, a repeated click toggles the popup closed.
      return false;
    }
    return {
      onPointerDown(event) {
        // Screen reader activations (Android TalkBack, desktop screen readers) report a
        // mouse-like `pointerType`, but `ignoreMouse` must not drop them: hover logic cannot
        // open for a virtual press since there is no real pointer movement to wait for.
        // Virtual `touch` presses (iOS VoiceOver) keep their type so `touchOpenDelay` applies.
        pointerTypeRef.current = (0, _event.isMouseLikePointerType)(event.pointerType, true) && (0, _event.isVirtualPointerEvent)(event.nativeEvent) ? 'virtual' : event.pointerType;
      },
      onMouseDown(event) {
        const pointerType = pointerTypeRef.current;
        const nativeEvent = event.nativeEvent;
        const open = store.select('open');

        // Ignore all buttons except for the "main" button.
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        if (event.button !== 0 || eventOption === 'click' || (0, _event.isMouseLikePointerType)(pointerType, true) && ignoreMouse) {
          return;
        }
        const nextOpen = getNextOpen(open, event.currentTarget, openEventType => openEventType === 'click' || openEventType === 'mousedown');

        // Animations sometimes won't run on a typeable element if using a rAF.
        // Focus is always set on these elements. For touch, we may delay opening.
        const target = (0, _element.getTarget)(nativeEvent);
        if ((0, _element.isTypeableElement)(target)) {
          setOpenWithTouchDelay(nextOpen, nativeEvent, target, pointerType);
          return;
        }

        // Capture the currentTarget before the rAF.
        // as React sets it to null after the event handler completes.
        const eventCurrentTarget = event.currentTarget;

        // Wait until focus is set on the element. This is an alternative to
        // `event.preventDefault()` to avoid :focus-visible from appearing when using a pointer.
        frame.request(() => {
          setOpenWithTouchDelay(nextOpen, nativeEvent, eventCurrentTarget, pointerType);
        });
      },
      onClick(event) {
        if (eventOption === 'mousedown-only') {
          return;
        }
        const pointerType = pointerTypeRef.current;
        if (eventOption === 'mousedown' && pointerType) {
          pointerTypeRef.current = undefined;
          return;
        }
        if ((0, _event.isMouseLikePointerType)(pointerType, true) && ignoreMouse) {
          return;
        }
        const open = store.select('open');
        const nextOpen = getNextOpen(open, event.currentTarget, openEventType => openEventType === 'click' || openEventType === 'mousedown' || openEventType === 'keydown' || openEventType === 'keyup');
        setOpenWithTouchDelay(nextOpen, event.nativeEvent, event.currentTarget, pointerType);
      },
      onKeyDown() {
        pointerTypeRef.current = undefined;
      }
    };
  }, [dataRef, eventOption, ignoreMouse, reason, store, stickIfOpen, toggle, frame, touchOpenTimeout, touchOpenDelay]);
  return React.useMemo(() => enabled ? {
    reference
  } : _empty.EMPTY_OBJECT, [enabled, reference]);
}