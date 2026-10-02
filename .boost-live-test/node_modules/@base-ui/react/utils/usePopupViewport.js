"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.popupViewportStateMapping = void 0;
exports.usePopupViewport = usePopupViewport;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _inertValue = require("@base-ui/utils/inertValue");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _usePreviousValue = require("@base-ui/utils/usePreviousValue");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _owner = require("@base-ui/utils/owner");
var _useAnimationsFinished = require("../internals/useAnimationsFinished");
var _usePopupAutoResize = require("./usePopupAutoResize");
var _directionProvider = require("../direction-provider");
var _adaptiveOriginMiddleware = require("./adaptiveOriginMiddleware");
var CommonPopupCssVars = _interopRequireWildcard(require("./CommonPopupCssVars"));
var CommonViewportDataAttributes = _interopRequireWildcard(require("./CommonViewportDataAttributes"));
var _jsxRuntime = require("react/jsx-runtime");
const popupViewportStateMapping = exports.popupViewportStateMapping = {
  activationDirection: value => value ? {
    [CommonViewportDataAttributes.activationDirection]: value
  } : null
};
/**
 * Builds morphing viewport containers for popups that animate between trigger-based content.
 * Handles previous-content snapshots, auto-resize, and state attributes for transitions.
 */
function usePopupViewport(parameters) {
  const {
    store,
    side,
    children
  } = parameters;
  const direction = (0, _directionProvider.useDirection)();
  const activeTrigger = store.useState('activeTriggerElement');
  const activeTriggerId = store.useState('activeTriggerId');
  const open = store.useState('open');
  const payload = store.useState('payload');
  const mounted = store.useState('mounted');
  const popupElement = store.useState('popupElement');
  const positionerElement = store.useState('positionerElement');
  const previousActiveTrigger = (0, _usePreviousValue.usePreviousValue)(open ? activeTrigger : null);
  // Remount current content on trigger changes (and once more when payload lags) to avoid DOM reuse flashes.
  // The key bumps immediately on trigger switches, then again if the payload arrives on a later render.
  const currentContentKey = usePopupContentKey(activeTriggerId, payload);
  const capturedNodeRef = React.useRef(null);
  const [previousContentNode, setPreviousContentNode] = React.useState(null);
  const [newTriggerOffset, setNewTriggerOffset] = React.useState(null);
  const currentContainerRef = React.useRef(null);
  const previousContainerRef = React.useRef(null);
  const onAnimationsFinished = (0, _useAnimationsFinished.useAnimationsFinished)(currentContainerRef, true);
  const cleanupFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const cleanupControllerRef = React.useRef(null);
  const [previousContentDimensions, setPreviousContentDimensions] = React.useState(null);
  const [showStartingStyleAttribute, setShowStartingStyleAttribute] = React.useState(false);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    store.set('adaptiveOrigin', _adaptiveOriginMiddleware.adaptiveOrigin);
    return () => {
      store.set('adaptiveOrigin', undefined);
    };
  }, [store]);
  const handleMeasureLayout = (0, _useStableCallback.useStableCallback)(() => {
    currentContainerRef.current?.style.setProperty('animation', 'none');
    currentContainerRef.current?.style.setProperty('transition', 'none');
    previousContainerRef.current?.style.setProperty('display', 'none');
  });
  const handleMeasureLayoutComplete = (0, _useStableCallback.useStableCallback)(previousDimensions => {
    currentContainerRef.current?.style.removeProperty('animation');
    currentContainerRef.current?.style.removeProperty('transition');
    previousContainerRef.current?.style.removeProperty('display');
    if (previousDimensions) {
      setPreviousContentDimensions(previousDimensions);
    }
  });
  const armViewportCleanup = (0, _useStableCallback.useStableCallback)(() => {
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
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open || !mounted) {
      lastHandledTriggerRef.current = null;
    }
  }, [open, mounted]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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
    const wrapper = (0, _owner.ownerDocument)(source).createElement('div');
    for (const child of Array.from(source.childNodes)) {
      wrapper.appendChild(child.cloneNode(true));
    }
    capturedNodeRef.current = wrapper;
  });
  const isTransitioning = previousContentNode != null;
  let childrenToRender;
  if (!isTransitioning) {
    childrenToRender = /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      "data-current": true,
      ref: currentContainerRef,
      children: children
    }, currentContentKey);
  } else {
    childrenToRender = /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        "data-previous": true,
        inert: (0, _inertValue.inertValue)(true),
        ref: previousContainerRef,
        style: {
          ...(previousContentDimensions ? {
            [CommonPopupCssVars.popupWidth]: `${previousContentDimensions.width}px`,
            [CommonPopupCssVars.popupHeight]: `${previousContentDimensions.height}px`
          } : null),
          position: 'absolute'
        },
        "data-ending-style": showStartingStyleAttribute ? undefined : ''
      }, "previous"), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        "data-current": true,
        ref: currentContainerRef,
        "data-starting-style": showStartingStyleAttribute ? '' : undefined,
        children: children
      }, currentContentKey)]
    });
  }

  // When previousContentNode is present, imperatively populate the previous container with the cloned children.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const container = previousContainerRef.current;
    if (!container || !previousContentNode) {
      return;
    }
    container.replaceChildren(...Array.from(previousContentNode.childNodes));
  }, [previousContentNode]);
  (0, _usePopupAutoResize.usePopupAutoResize)({
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
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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