"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _useControlled = require("@base-ui/utils/useControlled");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _owner = require("@base-ui/utils/owner");
var _floatingUiReact = require("../../floating-ui-react");
var _utils = require("../../floating-ui-react/utils");
var _useRenderElement = require("../../internals/useRenderElement");
var _NavigationMenuRootContext = require("./NavigationMenuRootContext");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _reasons = require("../../internals/reasons");
var NavigationMenuPositionerCssVars = _interopRequireWildcard(require("../positioner/NavigationMenuPositionerCssVars"));
var _setSharedFixedSize = require("../utils/setSharedFixedSize");
var _jsxRuntime = require("react/jsx-runtime");
const blockedReturnFocusReasons = new Set([_reasons.REASONS.triggerHover, _reasons.REASONS.outsidePress, _reasons.REASONS.focusOut]);
function getPositionerFixedSize(positionerElement) {
  // Read the last fixed positioner size rather than measuring the popup now:
  // during a controlled close, the popup can already be in its exit render and
  // report 0 before the closing transition gets a stable size to animate from.
  const width = parseFloat(positionerElement.style.getPropertyValue(NavigationMenuPositionerCssVars.positionerWidth)) || 0;
  const height = parseFloat(positionerElement.style.getPropertyValue(NavigationMenuPositionerCssVars.positionerHeight)) || 0;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return {
    width,
    height
  };
}

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuRoot = exports.NavigationMenuRoot = /*#__PURE__*/React.forwardRef(function NavigationMenuRoot(componentProps, forwardedRef) {
  const {
    defaultValue = null,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay = 50,
    closeDelay = 50,
    orientation = 'horizontal',
    onOpenChangeComplete
  } = componentProps;
  const nested = (0, _floatingUiReact.useFloatingParentNodeId)() != null;
  const parentRootContext = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)(true);
  const [value, setValueUnwrapped] = (0, _useControlled.useControlled)({
    controlled: valueParam,
    default: defaultValue,
    name: 'NavigationMenu',
    state: 'value'
  });

  // Derive open state from value being non-nullish
  const open = value != null;
  const closeReasonRef = React.useRef(undefined);
  const rootRef = React.useRef(null);
  const [positionerElement, setPositionerElement] = React.useState(null);
  const [popupElement, setPopupElement] = React.useState(null);
  const [viewportElement, setViewportElement] = React.useState(null);
  const [viewportTargetElement, setViewportTargetElement] = React.useState(null);
  const [activationDirection, setActivationDirection] = React.useState(null);
  const [floatingRootContext, setFloatingRootContext] = React.useState(undefined);
  const [viewportInert, setViewportInert] = React.useState(false);
  const prevTriggerElementRef = React.useRef(null);
  const currentContentRef = React.useRef(null);
  const beforeInsideRef = React.useRef(null);
  const afterInsideRef = React.useRef(null);
  const beforeOutsideRef = React.useRef(null);
  const afterOutsideRef = React.useRef(null);
  // Shared across triggers so a newly active trigger can cancel a stale
  // popup auto-size reset scheduled by the previously active trigger.
  const popupAutoSizeResetRef = React.useRef({
    abortController: null,
    owner: null
  });
  const {
    mounted,
    setMounted,
    transitionStatus
  } = (0, _useTransitionStatus.useTransitionStatus)(open);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open) {
      return;
    }
    if (!positionerElement || !popupElement) {
      return;
    }
    const closeTransitionSize = getPositionerFixedSize(positionerElement);
    if (!closeTransitionSize) {
      return;
    }

    // No cleanup is needed for this fixed size: if the popup unmounts, the inline
    // styles are removed with it. If it stays mounted, reopening runs the trigger's
    // sizing logic which clears these vars via `clearFixedSizes`/`setAutoSizes`.
    (0, _setSharedFixedSize.setSharedFixedSize)(popupElement, positionerElement, closeTransitionSize.width, closeTransitionSize.height);
  }, [open, popupElement, positionerElement]);
  React.useEffect(() => {
    setViewportInert(false);
  }, [value]);
  const setValue = (0, _useStableCallback.useStableCallback)((nextValue, eventDetails) => {
    if (nextValue == null) {
      closeReasonRef.current = eventDetails.reason;
    }
    if (nextValue !== value) {
      onValueChange?.(nextValue, eventDetails);
    }
    if (eventDetails.isCanceled) {
      return;
    }
    if (nextValue == null) {
      setActivationDirection(null);
      setFloatingRootContext(undefined);
    }
    setValueUnwrapped(nextValue);
    if (nested && nextValue == null && eventDetails.reason === _reasons.REASONS.linkPress && parentRootContext) {
      parentRootContext.setValue(null, eventDetails);
    }
  });
  const handleUnmount = (0, _useStableCallback.useStableCallback)(() => {
    const doc = (0, _owner.ownerDocument)(rootRef.current);
    const activeEl = (0, _utils.activeElement)(doc);
    const isReturnFocusBlocked = closeReasonRef.current ? blockedReturnFocusReasons.has(closeReasonRef.current) : false;
    if (!isReturnFocusBlocked && (0, _dom.isHTMLElement)(prevTriggerElementRef.current) && (activeEl === (0, _owner.ownerDocument)(popupElement).body || (0, _utils.contains)(popupElement, activeEl)) && popupElement) {
      prevTriggerElementRef.current.focus({
        preventScroll: true
      });
      prevTriggerElementRef.current = undefined;
    }
    setMounted(false);
    onOpenChangeComplete?.(false);
    setActivationDirection(null);
    setFloatingRootContext(undefined);
    currentContentRef.current = null;
    closeReasonRef.current = undefined;
  });

  // Providing `actionsRef` opts into manual unmounting, so close completion hooks leave it mounted.
  React.useImperativeHandle(actionsRef, () => ({
    unmount: handleUnmount
  }), [handleUnmount]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    enabled: !actionsRef,
    open,
    ref: {
      current: popupElement
    },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    }
  });
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    enabled: !actionsRef,
    open,
    ref: {
      current: viewportTargetElement
    },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    }
  });
  const contextActivationDirection = open ? activationDirection : null;
  const contextValue = React.useMemo(() => ({
    open,
    value,
    setValue,
    mounted,
    transitionStatus,
    positionerElement,
    setPositionerElement,
    popupElement,
    setPopupElement,
    viewportElement,
    setViewportElement,
    viewportTargetElement,
    setViewportTargetElement,
    activationDirection: contextActivationDirection,
    setActivationDirection,
    floatingRootContext,
    setFloatingRootContext,
    currentContentRef,
    nested,
    rootRef,
    beforeInsideRef,
    afterInsideRef,
    beforeOutsideRef,
    afterOutsideRef,
    prevTriggerElementRef,
    popupAutoSizeResetRef,
    delay,
    closeDelay,
    orientation,
    viewportInert,
    setViewportInert
  }), [open, value, setValue, mounted, transitionStatus, positionerElement, popupElement, viewportElement, viewportTargetElement, contextActivationDirection, floatingRootContext, nested, delay, closeDelay, orientation, viewportInert]);
  const jsx = /*#__PURE__*/(0, _jsxRuntime.jsx)(_NavigationMenuRootContext.NavigationMenuRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(TreeContext, {
      componentProps: componentProps,
      forwardedRef: forwardedRef,
      children: componentProps.children
    })
  });
  if (!nested) {
    // FloatingTree provides context to nested menus
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingTree, {
      children: jsx
    });
  }
  return jsx;
});
if (process.env.NODE_ENV !== "production") NavigationMenuRoot.displayName = "NavigationMenuRoot";
function TreeContext(props) {
  const {
    className,
    render,
    defaultValue,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay,
    closeDelay,
    orientation,
    onOpenChangeComplete,
    style,
    ...elementProps
  } = props.componentProps;
  const nodeId = (0, _floatingUiReact.useFloatingNodeId)();
  const {
    rootRef,
    nested,
    open
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const state = {
    open,
    nested
  };
  const element = (0, _useRenderElement.useRenderElement)(nested ? 'div' : 'nav', props.componentProps, {
    state,
    ref: [props.forwardedRef, rootRef],
    props: elementProps
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_NavigationMenuRootContext.NavigationMenuTreeContext.Provider, {
    value: nodeId,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingNode, {
      id: nodeId,
      children: element
    })
  });
}