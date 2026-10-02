"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SliderControl = void 0;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _addEventListener = require("@base-ui/utils/addEventListener");
var _owner = require("@base-ui/utils/owner");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _clamp = require("@base-ui/utils/clamp");
var _utils = require("../../floating-ui-react/utils");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useRenderElement = require("../../internals/useRenderElement");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _SliderRootContext = require("../root/SliderRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
var _getMidpoint = require("../utils/getMidpoint");
var _roundValueToStep = require("../utils/roundValueToStep");
var _validateMinimumDistance = require("../utils/validateMinimumDistance");
var _resolveThumbCollision = require("../utils/resolveThumbCollision");
const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;
function getControlOffset(styles, vertical) {
  if (!styles) {
    return {
      start: 0,
      end: 0
    };
  }
  function parseSize(value) {
    const parsed = value != null ? parseFloat(value) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  const start = !vertical ? 'InlineStart' : 'Top';
  const end = !vertical ? 'InlineEnd' : 'Bottom';
  return {
    start: parseSize(styles[`border${start}Width`]) + parseSize(styles[`padding${start}`]),
    end: parseSize(styles[`border${end}Width`]) + parseSize(styles[`padding${end}`])
  };
}
function getFingerCoords(event, touchIdRef) {
  // The event is TouchEvent
  if (touchIdRef.current != null && event.changedTouches) {
    const touchEvent = event;
    for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
      const touch = touchEvent.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        return {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    }
    return null;
  }

  // The event is PointerEvent
  return {
    x: event.clientX,
    y: event.clientY
  };
}

/**
 * The clickable, interactive part of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderControl = exports.SliderControl = /*#__PURE__*/React.forwardRef(function SliderControl(componentProps, forwardedRef) {
  const {
    render: renderProp,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    disabled,
    dragging,
    inset,
    lastChangeReasonRef,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted,
    orientation,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    pressedValuesRef,
    registerFieldControlRef,
    renderBeforeHydration,
    setActive,
    setDragging,
    setValue,
    state,
    step,
    thumbCollisionBehavior,
    thumbRefs,
    values
  } = (0, _SliderRootContext.useSliderRootContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const range = values.length > 1;
  const vertical = orientation === 'vertical';
  const controlRef = React.useRef(null);
  const stylesRef = React.useRef(null);
  const setStylesRef = (0, _useStableCallback.useStableCallback)(element => {
    if (element && stylesRef.current == null) {
      stylesRef.current = (0, _owner.ownerWindow)(element).getComputedStyle(element);
    }
  });

  // A number that uniquely identifies the current finger in the touch session.
  const touchIdRef = React.useRef(null);
  // The number of touch/pointermove events that have fired.
  const moveCountRef = React.useRef(0);
  // The offset amount to each side of the control for inset sliders.
  // This value should be equal to the radius or half the width/height of the thumb.
  const insetThumbOffsetRef = React.useRef(0);
  const currentInteractionValueRef = React.useRef(null);
  const latestValuesRef = (0, _useValueAsRef.useValueAsRef)(values);
  function getThumbInput(el) {
    return el?.querySelector('input[type="range"]');
  }
  function updatePressedThumb(nextIndex) {
    pressedThumbIndexRef.current = nextIndex;
    if (!thumbRefs.current[nextIndex]) {
      pressedThumbCenterOffsetRef.current = null;
    }
  }
  function resetPressedThumb() {
    pressedThumbIndexRef.current = -1;
    pressedThumbCenterOffsetRef.current = null;
  }
  function isTargetDisabledThumb(target) {
    if (!(0, _dom.isElement)(target)) {
      return false;
    }
    return thumbRefs.current.some(thumbEl => {
      if (!(0, _dom.isElement)(thumbEl) || !(0, _utils.contains)(thumbEl, target)) {
        return false;
      }
      return getThumbInput(thumbEl)?.disabled === true;
    });
  }
  function getFingerState(fingerCoords) {
    const control = controlRef.current;
    const thumbIndex = pressedThumbIndexRef.current;
    if (!control || thumbIndex < 0 || thumbIndex >= values.length) {
      if (thumbIndex >= values.length) {
        currentInteractionValueRef.current = null;
      }
      return null;
    }
    const {
      width,
      height,
      bottom,
      left,
      right
    } = control.getBoundingClientRect();
    const controlOffset = getControlOffset(stylesRef.current, vertical);
    const insetThumbOffset = insetThumbOffsetRef.current;
    const controlSize = (vertical ? height : width) - controlOffset.start - controlOffset.end - insetThumbOffset * 2;
    const thumbCenterOffset = pressedThumbCenterOffsetRef.current ?? 0;
    const fingerX = fingerCoords.x - thumbCenterOffset;
    const fingerY = fingerCoords.y - thumbCenterOffset;
    const valueSize = vertical ? bottom - fingerY - controlOffset.end : (direction === 'rtl' ? right - fingerX : fingerX - left) - controlOffset.start;
    // the value at the finger origin scaled down to fit the range [0, 1]
    const valueRescaled = (0, _clamp.clamp)((valueSize - insetThumbOffset) / controlSize, 0, 1);
    let newValue = (max - min) * valueRescaled + min;
    newValue = (0, _roundValueToStep.roundValueToStep)(newValue, step, min);
    newValue = (0, _clamp.clamp)(newValue, min, max);
    if (!range) {
      return {
        value: newValue,
        thumbIndex,
        didSwap: false
      };
    }
    return (0, _resolveThumbCollision.resolveThumbCollision)(thumbCollisionBehavior, values, latestValuesRef.current, pressedValuesRef.current, thumbIndex, newValue, min, max, step, minStepsBetweenValues);
  }
  function startPressing(fingerCoords) {
    pressedValuesRef.current = range ? values.slice() : null;
    currentInteractionValueRef.current = null;
    latestValuesRef.current = values;
    const pressedThumbIndex = pressedThumbIndexRef.current;
    let closestThumbIndex = pressedThumbIndex;
    if (pressedThumbIndex > -1 && pressedThumbIndex < values.length) {
      if (values[pressedThumbIndex] === max) {
        let candidateIndex = pressedThumbIndex;
        while (candidateIndex > 0 && values[candidateIndex - 1] === max) {
          candidateIndex -= 1;
        }
        closestThumbIndex = candidateIndex;
      }
    } else {
      // pressed on control
      const axis = !vertical ? 'x' : 'y';
      let minDistance;
      closestThumbIndex = -1;
      for (let i = 0; i < thumbRefs.current.length; i += 1) {
        const thumbEl = thumbRefs.current[i];
        if ((0, _dom.isElement)(thumbEl) && !getThumbInput(thumbEl)?.disabled) {
          const midpoint = (0, _getMidpoint.getMidpoint)(thumbEl, vertical);
          const distance = Math.abs(fingerCoords[axis] - midpoint);
          if (minDistance === undefined || distance <= minDistance) {
            closestThumbIndex = i;
            minDistance = distance;
          }
        }
      }
    }
    if (closestThumbIndex > -1 && closestThumbIndex !== pressedThumbIndex) {
      updatePressedThumb(closestThumbIndex);
    }
    if (inset) {
      const thumbEl = thumbRefs.current[closestThumbIndex];
      if ((0, _dom.isElement)(thumbEl)) {
        const thumbRect = thumbEl.getBoundingClientRect();
        const side = !vertical ? 'width' : 'height';
        insetThumbOffsetRef.current = thumbRect[side] / 2;
      }
    }
  }
  function focusThumb(thumbIndex) {
    const input = getThumbInput(thumbRefs.current?.[thumbIndex]);
    if (!input) {
      return;
    }
    input.focus({
      preventScroll: true,
      // Prevent pointer-driven focus rings in browsers that support this option.
      // Supported in Chrome from 144+.
      focusVisible: false
    });
  }
  function setValueFromPointer(finger, reason, nativeEvent) {
    const applied = setValue(finger.value, (0, _createBaseUIEventDetails.createChangeEventDetails)(reason, nativeEvent, undefined, {
      activeThumbIndex: finger.thumbIndex
    }));
    if (applied) {
      currentInteractionValueRef.current = finger.value;
      latestValuesRef.current = Array.isArray(finger.value) ? finger.value : [finger.value];

      // Only track and focus the swapped thumb once the change is actually applied so a
      // canceled swap doesn't leak the new index into subsequent moves.
      if (finger.didSwap) {
        updatePressedThumb(finger.thumbIndex);
        focusThumb(finger.thumbIndex);
      }
    }
    return applied;
  }
  const handleTouchMove = (0, _useStableCallback.useStableCallback)(nativeEvent => {
    const fingerCoords = getFingerCoords(nativeEvent, touchIdRef);
    if (fingerCoords == null) {
      return;
    }
    moveCountRef.current += 1;

    // Cancel move in case some other element consumed a pointerup event and it was not fired.
    if (nativeEvent.type === 'pointermove' && nativeEvent.buttons === 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleTouchEnd(nativeEvent);
      return;
    }
    const finger = getFingerState(fingerCoords);
    if (finger == null) {
      return;
    }
    if ((0, _validateMinimumDistance.validateMinimumDistance)(finger.value, step, minStepsBetweenValues)) {
      if (!dragging && moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
        setDragging(true);
      }
      setValueFromPointer(finger, _reasons.REASONS.drag, nativeEvent);
    }
  });
  const handleTouchEnd = (0, _useStableCallback.useStableCallback)(nativeEvent => {
    setActive(-1);
    setDragging(false);
    pressedThumbCenterOffsetRef.current = null;

    // If the value array shrank or grew mid-drag, the cached interaction value no longer
    // matches the current thumbs (the pressed index can still be in range), so dropping it
    // keeps a stale or malformed array from being committed on release.
    const interactionValue = currentInteractionValueRef.current;
    if (Array.isArray(interactionValue) && interactionValue.length !== values.length) {
      currentInteractionValueRef.current = null;
    }
    if (currentInteractionValueRef.current != null) {
      const commitReason = lastChangeReasonRef.current;
      onValueCommitted(currentInteractionValueRef.current, (0, _createBaseUIEventDetails.createGenericEventDetails)(commitReason, nativeEvent));
    }
    if ('pointerType' in nativeEvent && controlRef.current?.hasPointerCapture(nativeEvent.pointerId)) {
      controlRef.current?.releasePointerCapture(nativeEvent.pointerId);
    }
    pressedThumbIndexRef.current = -1;
    touchIdRef.current = null;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopListening();
  });
  const handleTouchStart = (0, _useStableCallback.useStableCallback)(nativeEvent => {
    if (disabled) {
      return;
    }
    if (isTargetDisabledThumb((0, _utils.getTarget)(nativeEvent))) {
      resetPressedThumb();
      return;
    }
    const touch = nativeEvent.changedTouches[0];
    if (touch == null) {
      return;
    }
    touchIdRef.current = touch.identifier;
    const fingerCoords = {
      x: touch.clientX,
      y: touch.clientY
    };
    startPressing(fingerCoords);
    const finger = getFingerState(fingerCoords);
    if (finger == null) {
      return;
    }
    focusThumb(finger.thumbIndex);
    setValueFromPointer(finger, _reasons.REASONS.trackPress, nativeEvent);
    moveCountRef.current = 0;
    const doc = (0, _owner.ownerDocument)(controlRef.current);
    doc.addEventListener('touchmove', handleTouchMove, {
      passive: true
    });
    doc.addEventListener('touchend', handleTouchEnd, {
      passive: true
    });
  });
  const stopListening = (0, _useStableCallback.useStableCallback)(() => {
    const doc = (0, _owner.ownerDocument)(controlRef.current);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
    pressedValuesRef.current = null;
    currentInteractionValueRef.current = null;
  });
  const focusFrame = (0, _useAnimationFrame.useAnimationFrame)();
  React.useEffect(() => {
    const control = controlRef.current;
    if (!control) {
      return () => stopListening();
    }
    const unsubscribeTouchStart = (0, _addEventListener.addEventListener)(control, 'touchstart', handleTouchStart, {
      passive: true
    });
    return () => {
      unsubscribeTouchStart();
      focusFrame.cancel();
      stopListening();
    };
  }, [stopListening, handleTouchStart, controlRef, focusFrame]);
  React.useEffect(() => {
    if (disabled) {
      stopListening();
    }
  }, [disabled, stopListening]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, registerFieldControlRef, controlRef, setStylesRef],
    props: [{
      ['data-base-ui-slider-control']: renderBeforeHydration ? '' : undefined,
      onPointerDown(event) {
        const control = controlRef.current;
        const target = (0, _utils.getTarget)(event.nativeEvent);
        if (!control || disabled || event.defaultPrevented || !(0, _dom.isElement)(target) ||
        // Only handle left clicks
        event.button !== 0) {
          return;
        }
        if (isTargetDisabledThumb(target)) {
          resetPressedThumb();
          return;
        }
        const fingerCoords = {
          x: event.clientX,
          y: event.clientY
        };
        startPressing(fingerCoords);
        const finger = getFingerState(fingerCoords);
        if (finger == null) {
          return;
        }
        const pressedOnFocusedThumb = (0, _utils.contains)(thumbRefs.current[finger.thumbIndex], (0, _utils.activeElement)((0, _owner.ownerDocument)(control)));
        if (pressedOnFocusedThumb) {
          event.preventDefault();
        } else {
          focusFrame.request(() => {
            focusThumb(finger.thumbIndex);
          });
        }
        setDragging(true);
        const pressedOnAnyThumb = pressedThumbCenterOffsetRef.current != null;
        if (!pressedOnAnyThumb) {
          setValueFromPointer(finger, _reasons.REASONS.trackPress, event.nativeEvent);
        }
        if (event.nativeEvent.pointerId) {
          control.setPointerCapture(event.nativeEvent.pointerId);
        }
        moveCountRef.current = 0;
        const doc = (0, _owner.ownerDocument)(control);
        doc.addEventListener('pointermove', handleTouchMove, {
          passive: true
        });
        doc.addEventListener('pointerup', handleTouchEnd, {
          once: true
        });
      }
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.sliderStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SliderControl.displayName = "SliderControl";