'use client';

import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { clamp } from '@base-ui/utils/clamp';
import { activeElement, contains, getTarget } from "../../floating-ui-react/utils.mjs";
import { createChangeEventDetails, createGenericEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useDirection } from "../../internals/direction-context/DirectionContext.mjs";
import { useSliderRootContext } from "../root/SliderRootContext.mjs";
import { sliderStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
import { getMidpoint } from "../utils/getMidpoint.mjs";
import { roundValueToStep } from "../utils/roundValueToStep.mjs";
import { validateMinimumDistance } from "../utils/validateMinimumDistance.mjs";
import { resolveThumbCollision } from "../utils/resolveThumbCollision.mjs";
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
export const SliderControl = /*#__PURE__*/React.forwardRef(function SliderControl(componentProps, forwardedRef) {
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
  } = useSliderRootContext();
  const direction = useDirection();
  const range = values.length > 1;
  const vertical = orientation === 'vertical';
  const controlRef = React.useRef(null);
  const stylesRef = React.useRef(null);
  const setStylesRef = useStableCallback(element => {
    if (element && stylesRef.current == null) {
      stylesRef.current = ownerWindow(element).getComputedStyle(element);
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
  const latestValuesRef = useValueAsRef(values);
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
    if (!isElement(target)) {
      return false;
    }
    return thumbRefs.current.some(thumbEl => {
      if (!isElement(thumbEl) || !contains(thumbEl, target)) {
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
    const valueRescaled = clamp((valueSize - insetThumbOffset) / controlSize, 0, 1);
    let newValue = (max - min) * valueRescaled + min;
    newValue = roundValueToStep(newValue, step, min);
    newValue = clamp(newValue, min, max);
    if (!range) {
      return {
        value: newValue,
        thumbIndex,
        didSwap: false
      };
    }
    return resolveThumbCollision(thumbCollisionBehavior, values, latestValuesRef.current, pressedValuesRef.current, thumbIndex, newValue, min, max, step, minStepsBetweenValues);
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
        if (isElement(thumbEl) && !getThumbInput(thumbEl)?.disabled) {
          const midpoint = getMidpoint(thumbEl, vertical);
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
      if (isElement(thumbEl)) {
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
    const applied = setValue(finger.value, createChangeEventDetails(reason, nativeEvent, undefined, {
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
  const handleTouchMove = useStableCallback(nativeEvent => {
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
    if (validateMinimumDistance(finger.value, step, minStepsBetweenValues)) {
      if (!dragging && moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
        setDragging(true);
      }
      setValueFromPointer(finger, REASONS.drag, nativeEvent);
    }
  });
  const handleTouchEnd = useStableCallback(nativeEvent => {
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
      onValueCommitted(currentInteractionValueRef.current, createGenericEventDetails(commitReason, nativeEvent));
    }
    if ('pointerType' in nativeEvent && controlRef.current?.hasPointerCapture(nativeEvent.pointerId)) {
      controlRef.current?.releasePointerCapture(nativeEvent.pointerId);
    }
    pressedThumbIndexRef.current = -1;
    touchIdRef.current = null;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopListening();
  });
  const handleTouchStart = useStableCallback(nativeEvent => {
    if (disabled) {
      return;
    }
    if (isTargetDisabledThumb(getTarget(nativeEvent))) {
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
    setValueFromPointer(finger, REASONS.trackPress, nativeEvent);
    moveCountRef.current = 0;
    const doc = ownerDocument(controlRef.current);
    doc.addEventListener('touchmove', handleTouchMove, {
      passive: true
    });
    doc.addEventListener('touchend', handleTouchEnd, {
      passive: true
    });
  });
  const stopListening = useStableCallback(() => {
    const doc = ownerDocument(controlRef.current);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
    pressedValuesRef.current = null;
    currentInteractionValueRef.current = null;
  });
  const focusFrame = useAnimationFrame();
  React.useEffect(() => {
    const control = controlRef.current;
    if (!control) {
      return () => stopListening();
    }
    const unsubscribeTouchStart = addEventListener(control, 'touchstart', handleTouchStart, {
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
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, registerFieldControlRef, controlRef, setStylesRef],
    props: [{
      ['data-base-ui-slider-control']: renderBeforeHydration ? '' : undefined,
      onPointerDown(event) {
        const control = controlRef.current;
        const target = getTarget(event.nativeEvent);
        if (!control || disabled || event.defaultPrevented || !isElement(target) ||
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
        const pressedOnFocusedThumb = contains(thumbRefs.current[finger.thumbIndex], activeElement(ownerDocument(control)));
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
          setValueFromPointer(finger, REASONS.trackPress, event.nativeEvent);
        }
        if (event.nativeEvent.pointerId) {
          control.setPointerCapture(event.nativeEvent.pointerId);
        }
        moveCountRef.current = 0;
        const doc = ownerDocument(control);
        doc.addEventListener('pointermove', handleTouchMove, {
          passive: true
        });
        doc.addEventListener('pointerup', handleTouchEnd, {
          once: true
        });
      }
    }, elementProps],
    stateAttributesMapping: sliderStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SliderControl.displayName = "SliderControl";