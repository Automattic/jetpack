"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isTouchLikePointerType = isTouchLikePointerType;
exports.usePressAndHold = usePressAndHold;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _empty = require("@base-ui/utils/empty");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _useInterval = require("@base-ui/utils/useInterval");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _owner = require("@base-ui/utils/owner");
const DEFAULT_TICK_DELAY = 60;
const DEFAULT_START_DELAY = 400;
const DEFAULT_SCROLL_DISTANCE = 8;
const TOUCH_TIMEOUT = 50;
const MAX_POINTER_MOVES_AFTER_TOUCH = 3;

// Treat pen as touch-like to avoid forcing the software keyboard on stylus taps.
// Linux Chrome may emit "pen" historically for mouse usage due to a bug, but the touch path
// still works with minor behavioral differences.
function isTouchLikePointerType(pointerType) {
  return pointerType === 'touch' || pointerType === 'pen';
}
/**
 * Adds press-and-hold behavior to a button element.
 * On pointer down, performs one action immediately, then after a delay starts
 * continuous repeated actions at a fixed interval. Handles mouse, touch, and pen
 * inputs correctly, including Android-specific quirks.
 */
function usePressAndHold(params) {
  const {
    disabled,
    tick,
    onStop,
    tickDelay = DEFAULT_TICK_DELAY,
    startDelay = DEFAULT_START_DELAY,
    scrollDistance = DEFAULT_SCROLL_DISTANCE,
    elementRef
  } = params;
  const startTickTimeout = (0, _useTimeout.useTimeout)();
  const tickInterval = (0, _useInterval.useInterval)();
  const intentionalTouchCheckTimeout = (0, _useTimeout.useTimeout)();
  const isPressedRef = React.useRef(false);
  const movesAfterTouchRef = React.useRef(0);
  const downCoordsRef = React.useRef({
    x: 0,
    y: 0
  });
  const isTouchingButtonRef = React.useRef(false);
  const ignoreClickRef = React.useRef(false);
  const pointerTypeRef = React.useRef('');
  const unsubscribeFromGlobalContextMenuRef = React.useRef(_empty.NOOP);
  const unsubscribeFromGlobalPointerUpRef = React.useRef(_empty.NOOP);
  const stopAutoChange = (0, _useStableCallback.useStableCallback)(() => {
    intentionalTouchCheckTimeout.clear();
    startTickTimeout.clear();
    tickInterval.clear();
    unsubscribeFromGlobalContextMenuRef.current();
    movesAfterTouchRef.current = 0;
  });
  function startAutoChange(triggerNativeEvent) {
    stopAutoChange();
    const element = elementRef.current;
    if (!element) {
      return;
    }
    const win = (0, _owner.ownerWindow)(element);
    function handleContextMenu(event) {
      event.preventDefault();
    }

    // A global context menu listener is necessary to prevent the context menu from
    // appearing when the touch is slightly outside of the element's hit area.
    unsubscribeFromGlobalContextMenuRef.current = (0, _addEventListener.addEventListener)(win, 'contextmenu', handleContextMenu);

    // The release listener stays registered through `stopAutoChange` so a hold that auto-stops at
    // a boundary (a repeat tick returning `false`) still fires `onStop` on release. Replace any
    // existing one first so a mouseleave/mouseenter cycle during a hold doesn't stack listeners
    // (which would otherwise fire `onStop` more than once on release).
    unsubscribeFromGlobalPointerUpRef.current();
    unsubscribeFromGlobalPointerUpRef.current = (0, _addEventListener.addEventListener)(win, 'pointerup', event => {
      isPressedRef.current = false;
      stopAutoChange();
      onStop?.(event);
    }, {
      once: true
    });
    if (!tick(triggerNativeEvent)) {
      stopAutoChange();
      return;
    }
    startTickTimeout.start(startDelay, () => {
      tickInterval.start(tickDelay, () => {
        if (!tick(triggerNativeEvent)) {
          stopAutoChange();
        }
      });
    });
  }
  React.useEffect(() => () => {
    stopAutoChange();
    unsubscribeFromGlobalPointerUpRef.current();
  }, [stopAutoChange]);
  React.useEffect(() => {
    if (disabled) {
      isPressedRef.current = false;
      isTouchingButtonRef.current = false;
      pointerTypeRef.current = '';
      stopAutoChange();
    }
  }, [disabled, stopAutoChange]);
  const pointerHandlers = {
    onTouchStart() {
      isTouchingButtonRef.current = true;
    },
    onTouchEnd() {
      isTouchingButtonRef.current = false;
    },
    onPointerDown(event) {
      if (event.defaultPrevented || event.button || disabled) {
        return;
      }
      pointerTypeRef.current = event.pointerType;
      ignoreClickRef.current = false;
      isPressedRef.current = true;
      downCoordsRef.current = {
        x: event.clientX,
        y: event.clientY
      };
      const isTouchPointer = isTouchLikePointerType(event.pointerType);
      if (!isTouchPointer) {
        event.preventDefault();
        startAutoChange(event.nativeEvent);
      } else {
        // Check if the pointerdown was intentional and not the result of a scroll or
        // pinch-zoom. In that case, we don't want to start the auto-change sequence.
        intentionalTouchCheckTimeout.start(TOUCH_TIMEOUT, () => {
          const moves = movesAfterTouchRef.current;
          movesAfterTouchRef.current = 0;
          // Only start auto-change if the touch is still pressed (prevents races
          // with pointerup occurring before the timeout fires on quick taps).
          const stillPressed = isPressedRef.current;
          if (stillPressed && moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
            startAutoChange(event.nativeEvent);
            ignoreClickRef.current = true; // synthesized click after hold should be ignored
          } else {
            // No auto-change (simple tap or scroll gesture), allow the click handler
            // to perform a single action.
            ignoreClickRef.current = false;
            stopAutoChange();
          }
        });
      }
    },
    onPointerUp(event) {
      // Ensure we mark the press as released for touch flows even if auto-change never
      // started, so the delayed auto-change check won't start after a quick tap.
      if (isTouchLikePointerType(event.pointerType)) {
        isPressedRef.current = false;
      }
    },
    onPointerMove(event) {
      if (disabled || !isTouchLikePointerType(event.pointerType) || !isPressedRef.current) {
        return;
      }
      movesAfterTouchRef.current += 1;
      const {
        x,
        y
      } = downCoordsRef.current;
      const dx = x - event.clientX;
      const dy = y - event.clientY;
      if (dx ** 2 + dy ** 2 > scrollDistance ** 2) {
        stopAutoChange();
      }
    },
    onMouseEnter(event) {
      if (event.defaultPrevented || disabled || !isPressedRef.current || isTouchingButtonRef.current || isTouchLikePointerType(pointerTypeRef.current)) {
        return;
      }
      startAutoChange(event.nativeEvent);
    },
    onMouseLeave() {
      if (isTouchingButtonRef.current) {
        return;
      }
      stopAutoChange();
    },
    onMouseUp() {
      if (isTouchingButtonRef.current) {
        return;
      }
      stopAutoChange();
    }
  };
  const shouldSkipClick = (0, _useStableCallback.useStableCallback)(event => {
    if (event.defaultPrevented) {
      return true;
    }
    if (isTouchLikePointerType(pointerTypeRef.current)) {
      return ignoreClickRef.current;
    }
    return event.detail !== 0;
  });
  return {
    pointerHandlers,
    shouldSkipClick
  };
}