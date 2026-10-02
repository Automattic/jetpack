'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { inertValue } from '@base-ui/utils/inertValue';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import { useAnimationsFinished } from "../internals/useAnimationsFinished.mjs";
import { usePopupAutoResize } from "./usePopupAutoResize.mjs";
import { useDirection } from "../direction-provider/index.mjs";
import { adaptiveOrigin } from "./adaptiveOriginMiddleware.mjs";
import * as CommonPopupCssVars from "./CommonPopupCssVars.mjs";
import * as CommonViewportDataAttributes from "./CommonViewportDataAttributes.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const popupViewportStateMapping = {
  activationDirection: value => value ? {
    [CommonViewportDataAttributes.activationDirection]: value
  } : null
};
/**
 * Builds morphing viewport containers for popups that animate between trigger-based content.
 * Handles previous-content snapshots, auto-resize, and state attributes for transitions.
 */
export function usePopupViewport(parameters) {
  const {
    store,
    side,
    children
  } = parameters;
  const direction = useDirection();
  const activeTrigger = store.useState('activeTriggerElement');
  const activeTriggerId = store.useState('activeTriggerId');
  const open = store.useState('open');
  const payload = store.useState('payload');
  const mounted = store.useState('mounted');
  const popupElement = store.useState('popupElement');
  const positionerElement = store.useState('positionerElement');
  const previousActiveTrigger = usePreviousValue(open ? activeTrigger : null);
  // Remount current content on trigger changes (and once more when payload lags) to avoid DOM reuse flashes.
  // The key bumps immediately on trigger switches, then again if the payload arrives on a later render.
  const currentContentKey = usePopupContentKey(activeTriggerId, payload);
  const capturedNodeRef = React.useRef(null);
  const [previousContentNode, setPreviousContentNode] = React.useState(null);
  const [newTriggerOffset, setNewTriggerOffset] = React.useState(null);
  const currentContainerRef = React.useRef(null);
  const previousContainerRef = React.useRef(null);
  const onAnimationsFinished = useAnimationsFinished(currentContainerRef, true);
  const cleanupFrame = useAnimationFrame();
  const cleanupControllerRef = React.useRef(null);
  const [previousContentDimensions, setPreviousContentDimensions] = React.useState(null);
  const [showStartingStyleAttribute, setShowStartingStyleAttribute] = React.useState(false);
  useIsoLayoutEffect(() => {
    store.set('adaptiveOrigin', adaptiveOrigin);
    return () => {
      store.set('adaptiveOrigin', undefined);
    };
  }, [store]);
  const handleMeasureLayout = useStableCallback(() => {
    currentContainerRef.current?.style.setProperty('animation', 'none');
    currentContainerRef.current?.style.setProperty('transition', 'none');
    previousContainerRef.current?.style.setProperty('display', 'none');
  });
  const handleMeasureLayoutComplete = useStableCallback(previousDimensions => {
    currentContainerRef.current?.style.removeProperty('animation');
    currentContainerRef.current?.style.removeProperty('transition');
    previousContainerRef.current?.style.removeProperty('display');
    if (previousDimensions) {
      setPreviousContentDimensions(previousDimensions);
    }
  });
  const armViewportCleanup = useStableCallback(() => {
    cleanupControllerRef.current?.abort();
    const controller = new AbortController();
    cleanupControllerRef.current = controller;
    onAnimationsFinished(() => {
      setPreviousContentNode(null);
      setPreviousContentDimensions(null);
      capturedNodeRef.current = null;
    }, controller.signal);
  });
  const lastHandledTriggerRef = React.useRef(null);
  useIsoLayoutEffect(() => {
    if (!open || !mounted) {
      lastHandledTriggerRef.current = null;
    }
  }, [open, mounted]);
  useIsoLayoutEffect(() => {
    // When a trigger changes, set the captured children HTML to state,
    // so we can render both new and old content.
    if (activeTrigger && previousActiveTrigger && activeTrigger !== previousActiveTrigger && lastHandledTriggerRef.current !== activeTrigger && capturedNodeRef.current) {
      setPreviousContentNode(capturedNodeRef.current);
      setShowStartingStyleAttribute(true);

      // Calculate the relative position between the previous and new trigger,
      // so we can pass it to the style hook for animation purposes.
      const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
      setNewTriggerOffset(offset);
      lastHandledTriggerRef.current = activeTrigger;
    }
  }, [activeTrigger, previousActiveTrigger]);

  // Arm cleanup after a trigger change, and re-arm it if the current container remounts
  // mid-transition when a lagging payload bumps `currentContentKey`. The remount discards
  // the running entry animation (and with transition-style CSS the replacement mounts at
  // final styles with no animation at all), so re-run the starting-style choreography —
  // otherwise the watcher either strands or fires before the previous container's exit
  // animation finishes.
  useIsoLayoutEffect(() => {
    if (previousContentNode == null) {
      return;
    }

    // Abort the stale watcher synchronously. The remount cancels the old container's
    // animations, and the resulting promise rejection would otherwise run the cleanup
    // in a microtask before the re-armed watcher below is in place.
    cleanupControllerRef.current?.abort();
    setShowStartingStyleAttribute(true);
    cleanupFrame.request(() => {
      ReactDOM.flushSync(() => {
        setShowStartingStyleAttribute(false);
      });
      armViewportCleanup();
    });
  }, [currentContentKey, previousContentNode, armViewportCleanup, cleanupFrame]);

  // Capture a clone of the current content DOM subtree when not transitioning.
  // We can't store previous React nodes as they may be stateful; instead we capture DOM clones for visual continuity.
  useIsoLayoutEffect(() => {
    // When a transition is in progress, we store the next content in capturedNodeRef.
    // This handles the case where the trigger changes multiple times before the transition finishes.
    // We want to always capture the latest content for the previous snapshot.
    // So clicking quickly on T1, T2, T3 will result in the following sequence:
    // 1. T1 -> T2: previousContent = T1, currentContent = T2
    // 2. T2 -> T3: previousContent = T2, currentContent = T3
    const source = currentContainerRef.current;
    if (!source) {
      return;
    }
    const wrapper = ownerDocument(source).createElement('div');
    for (const child of Array.from(source.childNodes)) {
      wrapper.appendChild(child.cloneNode(true));
    }
    capturedNodeRef.current = wrapper;
  });
  const isTransitioning = previousContentNode != null;
  let childrenToRender;
  if (!isTransitioning) {
    childrenToRender = /*#__PURE__*/_jsx("div", {
      "data-current": true,
      ref: currentContainerRef,
      children: children
    }, currentContentKey);
  } else {
    childrenToRender = /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx("div", {
        "data-previous": true,
        inert: inertValue(true),
        ref: previousContainerRef,
        style: {
          ...(previousContentDimensions ? {
            [CommonPopupCssVars.popupWidth]: `${previousContentDimensions.width}px`,
            [CommonPopupCssVars.popupHeight]: `${previousContentDimensions.height}px`
          } : null),
          position: 'absolute'
        },
        "data-ending-style": showStartingStyleAttribute ? undefined : ''
      }, "previous"), /*#__PURE__*/_jsx("div", {
        "data-current": true,
        ref: currentContainerRef,
        "data-starting-style": showStartingStyleAttribute ? '' : undefined,
        children: children
      }, currentContentKey)]
    });
  }

  // When previousContentNode is present, imperatively populate the previous container with the cloned children.
  useIsoLayoutEffect(() => {
    const container = previousContainerRef.current;
    if (!container || !previousContentNode) {
      return;
    }
    container.replaceChildren(...Array.from(previousContentNode.childNodes));
  }, [previousContentNode]);
  usePopupAutoResize({
    popupElement,
    positionerElement,
    mounted,
    content: payload,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
    side,
    direction
  });
  const state = {
    activationDirection: getActivationDirection(newTriggerOffset),
    transitioning: isTransitioning
  };
  return {
    children: childrenToRender,
    state
  };
}
/**
 * Returns a string describing the provided offset.
 * It describes both the horizontal and vertical offset, separated by a space.
 *
 * @param offset
 */
function getActivationDirection(offset) {
  if (!offset) {
    return undefined;
  }
  return `${getValueWithTolerance(offset.horizontal, 5, 'right', 'left')} ${getValueWithTolerance(offset.vertical, 5, 'down', 'up')}`;
}

/**
 * Returns a label describing the value (positive/negative) treating values
 * within tolerance as zero.
 *
 * @param value Value to check
 * @param tolerance Tolerance to treat the value as zero.
 * @param positiveLabel
 * @param negativeLabel
 * @returns If 0 < abs(value) < tolerance, returns an empty string. Otherwise returns positiveLabel or negativeLabel.
 */
function getValueWithTolerance(value, tolerance, positiveLabel, negativeLabel) {
  if (value > tolerance) {
    return positiveLabel;
  }
  if (value < -tolerance) {
    return negativeLabel;
  }
  return '';
}

/**
 * Calculates the relative position between centers of two elements.
 */
function calculateRelativePosition(from, to) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const fromCenter = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2
  };
  const toCenter = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2
  };
  return {
    horizontal: toCenter.x - fromCenter.x,
    vertical: toCenter.y - fromCenter.y
  };
}

/**
 * Returns a key that forces remounting content when triggers change or a payload is updated.
 */
function usePopupContentKey(activeTriggerId, payload) {
  const [contentKey, setContentKey] = React.useState(0);
  const previousActiveTriggerIdRef = React.useRef(activeTriggerId);
  const previousPayloadRef = React.useRef(payload);
  const pendingPayloadUpdateRef = React.useRef(false);
  useIsoLayoutEffect(() => {
    // Compare against the last committed values to decide whether we need a new DOM subtree.
    const previousActiveTriggerId = previousActiveTriggerIdRef.current;
    const previousPayload = previousPayloadRef.current;
    const triggerIdChanged = activeTriggerId !== previousActiveTriggerId;
    const payloadChanged = payload !== previousPayload;
    if (triggerIdChanged) {
      // Remount immediately on trigger change; remember if payload hasn't caught up yet.
      setContentKey(value => value + 1);
      pendingPayloadUpdateRef.current = !payloadChanged;
    } else if (pendingPayloadUpdateRef.current && payloadChanged) {
      // Payload arrived a render later, so remount once more to avoid reusing the old <img>.
      setContentKey(value => value + 1);
      pendingPayloadUpdateRef.current = false;
    }

    // Persist current values for the next render's comparison.
    previousActiveTriggerIdRef.current = activeTriggerId;
    previousPayloadRef.current = payload;
  }, [activeTriggerId, payload]);
  return `${activeTriggerId ?? 'current'}-${contentKey}`;
}