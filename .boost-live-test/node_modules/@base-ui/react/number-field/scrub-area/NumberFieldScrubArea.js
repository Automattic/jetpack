"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldScrubArea = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _mergeCleanups = require("@base-ui/utils/mergeCleanups");
var _owner = require("@base-ui/utils/owner");
var _platform = require("@base-ui/utils/platform");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _NumberFieldRootContext = require("../root/NumberFieldRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _NumberFieldScrubAreaContext = require("./NumberFieldScrubAreaContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _getViewportRect = require("../utils/getViewportRect");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _utils = require("../../floating-ui-react/utils");
var _jsxRuntime = require("react/jsx-runtime");
const SCRUB_AREA_STYLE = {
  touchAction: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none'
};

/**
 * An interactive area where the user can click and drag to change the field value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldScrubArea = exports.NumberFieldScrubArea = /*#__PURE__*/React.forwardRef(function NumberFieldScrubArea(componentProps, forwardedRef) {
  const {
    render,
    className,
    direction = 'horizontal',
    pixelSensitivity = 2,
    teleportDistance,
    style,
    ...elementProps
  } = componentProps;
  const {
    state,
    setIsScrubbing: setRootScrubbing,
    inputRef,
    focusInput,
    incrementValue,
    allowInputSyncRef,
    getStepAmount,
    onValueCommitted,
    lastChangedValueRef,
    valueRef
  } = (0, _NumberFieldRootContext.useNumberFieldRootContext)();
  const {
    disabled,
    readOnly
  } = state;
  const scrubAreaRef = React.useRef(null);
  const isScrubbingRef = React.useRef(false);
  const didMoveRef = React.useRef(false);
  const pointerDownTargetRef = React.useRef(null);
  const scrubAreaCursorRef = React.useRef(null);
  const virtualCursorCoords = React.useRef({
    x: 0,
    y: 0
  });
  const exitPointerLockTimeout = (0, _useTimeout.useTimeout)();
  const [isTouchInput, setIsTouchInput] = React.useState(false);
  const [isPointerLockDenied, setIsPointerLockDenied] = React.useState(false);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  function updateCursorTransform(virtualCursor, x, y) {
    // Invert the visual viewport scale so the cursor matches the OS cursor, which doesn't
    // scale with the content on pinch-zoom.
    const scale = (0, _owner.ownerWindow)(virtualCursor).visualViewport?.scale ?? 1;
    virtualCursor.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 / scale})`;
  }
  const onScrub = (0, _useStableCallback.useStableCallback)(({
    movementX,
    movementY
  }) => {
    const virtualCursor = scrubAreaCursorRef.current;
    const scrubAreaEl = scrubAreaRef.current;
    if (!virtualCursor || !scrubAreaEl) {
      return;
    }
    const rect = (0, _getViewportRect.getViewportRect)(teleportDistance, scrubAreaEl);
    const coords = virtualCursorCoords.current;

    // Wrap the cursor to the opposite edge when its center crosses a viewport bound.
    const wrap = (coord, halfSize, low, high) => {
      if (coord + halfSize < low) {
        return high - halfSize;
      }
      if (coord + halfSize > high) {
        return low - halfSize;
      }
      return coord;
    };
    const newCoords = {
      x: wrap(Math.round(coords.x + movementX), virtualCursor.offsetWidth / 2, rect.left, rect.right),
      y: wrap(Math.round(coords.y + movementY), virtualCursor.offsetHeight / 2, rect.top, rect.bottom)
    };
    virtualCursorCoords.current = newCoords;
    updateCursorTransform(virtualCursor, newCoords.x, newCoords.y);
  });
  const onScrubbingChange = (0, _useStableCallback.useStableCallback)((scrubbingValue, {
    clientX,
    clientY
  }) => {
    ReactDOM.flushSync(() => {
      setIsScrubbing(scrubbingValue);
      setRootScrubbing(scrubbingValue);
    });
    const virtualCursor = scrubAreaCursorRef.current;
    if (!virtualCursor || !scrubbingValue) {
      return;
    }
    const initialCoords = {
      x: clientX - virtualCursor.offsetWidth / 2,
      y: clientY - virtualCursor.offsetHeight / 2
    };
    virtualCursorCoords.current = initialCoords;
    updateCursorTransform(virtualCursor, initialCoords.x, initialCoords.y);
  });
  React.useEffect(function registerGlobalScrubbingEventListeners() {
    // Only listen while actively scrubbing; avoids unrelated pointerup events committing.
    if (!inputRef.current || disabled || readOnly || !isScrubbing) {
      return undefined;
    }
    let cumulativeDelta = 0;
    function handleScrubPointerUp(event) {
      function handler() {
        try {
          (0, _owner.ownerDocument)(scrubAreaRef.current).exitPointerLock();
        } catch {
          // Ignore errors.
        } finally {
          isScrubbingRef.current = false;
          onScrubbingChange(false, event);
          onValueCommitted(lastChangedValueRef.current ?? valueRef.current, (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.scrub, event));

          // Manually dispatch a click event if no movement happened, since
          // preventDefault on pointerdown prevents the browser click event.
          const pointerDownTarget = pointerDownTargetRef.current;
          const input = inputRef.current;
          if (!didMoveRef.current && pointerDownTarget != null && input) {
            pointerDownTarget.dispatchEvent(new ((0, _owner.ownerWindow)(input).MouseEvent)('click', {
              bubbles: true,
              cancelable: true
            }));
          }
          didMoveRef.current = false;
          pointerDownTargetRef.current = null;
        }
      }
      if (_platform.platform.engine.gecko) {
        // Firefox needs a small delay here when soft-clicking as the pointer
        // lock will not release otherwise.
        exitPointerLockTimeout.start(20, handler);
      } else {
        handler();
      }
    }
    function handleScrubPointerMove(event) {
      // The effects below can tear down and re-run without unmounting (`<Activity>`), which
      // clears the ref while `isScrubbing` stays `true` and re-attaches this listener. The ref
      // is the source of truth for whether a pointer is actually down.
      if (!isScrubbingRef.current) {
        return;
      }

      // Prevent text selection.
      event.preventDefault();
      onScrub(event);
      const {
        movementX,
        movementY
      } = event;
      cumulativeDelta += direction === 'vertical' ? movementY : movementX;
      if (Math.abs(cumulativeDelta) >= pixelSensitivity) {
        cumulativeDelta = 0;
        didMoveRef.current = true;
        const dValue = direction === 'vertical' ? -movementY : movementX;
        const stepAmount = getStepAmount(event);
        const rawAmount = dValue * stepAmount;
        if (rawAmount !== 0) {
          allowInputSyncRef.current = true;
          incrementValue(Math.abs(rawAmount), {
            direction: rawAmount >= 0 ? 1 : -1,
            event,
            reason: _reasons.REASONS.scrub
          });
        }
      }
    }
    const win = (0, _owner.ownerWindow)(inputRef.current);
    const unsubscribe = (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(win, 'pointerup', handleScrubPointerUp, true), (0, _addEventListener.addEventListener)(win, 'pointermove', handleScrubPointerMove, true));
    return () => {
      exitPointerLockTimeout.clear();
      unsubscribe();
    };
  }, [disabled, readOnly, allowInputSyncRef, incrementValue, isScrubbing, getStepAmount, inputRef, onScrubbingChange, onScrub, direction, pixelSensitivity, lastChangedValueRef, onValueCommitted, valueRef, exitPointerLockTimeout]);

  // If the scrub area unmounts mid-scrub, release pointer lock and clear the root's scrubbing
  // state so it doesn't stay locked or stuck. (No commit: there's no pointer release here.)
  React.useEffect(() => () => {
    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      setRootScrubbing(false);
      try {
        (0, _owner.ownerDocument)(scrubAreaRef.current).exitPointerLock();
      } catch {
        // Ignore errors.
      }
    }
  }, [setRootScrubbing]);

  // Prevent scrolling using touch input when scrubbing.
  React.useEffect(function registerScrubberTouchPreventListener() {
    const element = scrubAreaRef.current;
    if (!element || disabled || readOnly) {
      return undefined;
    }
    function handleTouchStart(event) {
      if (event.touches.length === 1) {
        event.preventDefault();
      }
    }
    return (0, _addEventListener.addEventListener)(element, 'touchstart', handleTouchStart);
  }, [disabled, readOnly]);
  const defaultProps = {
    role: 'presentation',
    style: SCRUB_AREA_STYLE,
    async onPointerDown(event) {
      if (event.defaultPrevented || readOnly || event.button || disabled) {
        return;
      }
      const isTouch = event.pointerType === 'touch';
      setIsTouchInput(isTouch);
      if (event.pointerType === 'mouse') {
        event.preventDefault();
        focusInput();
      }
      isScrubbingRef.current = true;
      didMoveRef.current = false;
      pointerDownTargetRef.current = (0, _utils.getTarget)(event.nativeEvent);
      onScrubbingChange(true, event.nativeEvent);

      // WebKit causes significant layout shift with the native message, so we can't use it.
      if (!isTouch && !_platform.platform.engine.webkit) {
        try {
          // Avoid non-deterministic errors in testing environments. This error sometimes
          // appears:
          // "The root document of this element is not valid for pointer lock."
          await (0, _owner.ownerDocument)(scrubAreaRef.current).body.requestPointerLock();
          setIsPointerLockDenied(false);
        } catch (error) {
          setIsPointerLockDenied(true);
        } finally {
          // `onScrubbingChange` already wraps its state updates in `flushSync`, so re-emit the
          // scrubbing state directly (no extra nested `flushSync`) to reflect the resolved
          // pointer-lock result on the cursor.
          if (isScrubbingRef.current) {
            onScrubbingChange(true, event.nativeEvent);
          }
        }
      }
    }
  };
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    ref: [forwardedRef, scrubAreaRef],
    state,
    props: [defaultProps, elementProps],
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  const contextValue = React.useMemo(() => ({
    isScrubbing,
    isTouchInput,
    isPointerLockDenied,
    scrubAreaCursorRef
  }), [isScrubbing, isTouchInput, isPointerLockDenied]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_NumberFieldScrubAreaContext.NumberFieldScrubAreaContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") NumberFieldScrubArea.displayName = "NumberFieldScrubArea";