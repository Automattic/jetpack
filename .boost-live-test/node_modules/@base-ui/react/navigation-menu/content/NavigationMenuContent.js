"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuContent = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _inertValue = require("@base-ui/utils/inertValue");
var _empty = require("@base-ui/utils/empty");
var _floatingUiReact = require("../../floating-ui-react");
var _utils = require("../../floating-ui-react/utils");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _NavigationMenuItemContext = require("../item/NavigationMenuItemContext");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _CompositeRoot = require("../../internals/composite/root/CompositeRoot");
var _popupStateMapping = require("../../utils/popupStateMapping");
var NavigationMenuContentDataAttributes = _interopRequireWildcard(require("./NavigationMenuContentDataAttributes"));
var _jsxRuntime = require("react/jsx-runtime");
const stateAttributesMapping = {
  ..._popupStateMapping.popupStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping,
  activationDirection(value) {
    if (!value) {
      return null;
    }
    return {
      [NavigationMenuContentDataAttributes.activationDirection]: value
    };
  }
};

/**
 * A container for the content of the navigation menu item that is moved into the popup
 * when the item is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuContent = exports.NavigationMenuContent = /*#__PURE__*/React.forwardRef(function NavigationMenuContent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const {
    mounted: popupMounted,
    viewportElement,
    value,
    activationDirection,
    currentContentRef,
    viewportTargetElement
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const {
    value: itemValue
  } = (0, _NavigationMenuItemContext.useNavigationMenuItemContext)();
  const nodeId = (0, _NavigationMenuRootContext.useNavigationMenuTreeContext)();
  const open = popupMounted && value === itemValue;
  const ref = React.useRef(null);
  const [hasMountedInPortal, setHasMountedInPortal] = React.useState(false);
  const [focusInside, setFocusInside] = React.useState(false);
  const {
    mounted,
    setMounted,
    transitionStatus
  } = (0, _useTransitionStatus.useTransitionStatus)(open);

  // If the popup unmounts before the content's exit animation completes, reset the internal
  // mounted state so the next open can re-enter via `transitionStatus="starting"`.
  if (mounted && !popupMounted) {
    setMounted(false);
  }
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    ref,
    open,
    onComplete() {
      if (!open) {
        setMounted(false);
      }
    }
  });

  // When a content re-enters while still mounted (e.g. switching top-level triggers
  // back before the exit animation completes), the DOM element hasn't changed so the
  // callback ref won't fire again. Ensure the shared ref is updated so the
  // MutationObserver in the trigger watches the correct content element.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open && ref.current) {
      currentContentRef.current = ref.current;
    }
  }, [open, currentContentRef]);
  const state = {
    open,
    transitionStatus,
    activationDirection
  };
  const handleCurrentContentRef = (0, _useStableCallback.useStableCallback)(node => {
    // Inactive `keepMounted` content also mounts in the viewport; only the
    // active content can own the shared sizing observer target.
    if (node && open) {
      currentContentRef.current = node;
    }
  });
  const commonProps = {
    onFocus(event) {
      const target = (0, _utils.getTarget)(event.nativeEvent);
      if (target?.hasAttribute('data-base-ui-focus-guard')) {
        return;
      }
      setFocusInside(true);
    },
    onBlur(event) {
      if (!(0, _utils.contains)(event.currentTarget, event.relatedTarget)) {
        setFocusInside(false);
      }
    }
  };
  const defaultProps = !open && mounted ? {
    style: {
      position: 'absolute',
      top: 0,
      left: 0
    },
    inert: (0, _inertValue.inertValue)(!focusInside),
    ...commonProps
  } : commonProps;
  const portalContainer = viewportTargetElement || viewportElement;
  const hidden = keepMounted && !mounted;
  const shouldRenderInline = keepMounted && !portalContainer && !hasMountedInPortal;
  if (keepMounted && portalContainer && !hasMountedInPortal) {
    setHasMountedInPortal(true);
  }
  if (shouldRenderInline) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef],
      props: [defaultProps, {
        hidden: true
      }, elementProps],
      stateAttributesMapping: stateAttributesMapping
    });
  }
  if (!portalContainer || !mounted && !keepMounted) {
    return null;
  }
  return /*#__PURE__*/ReactDOM.createPortal(/*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingNode, {
    id: nodeId,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef, ref, handleCurrentContentRef],
      props: [defaultProps, hidden ? {
        hidden: true
      } : _empty.EMPTY_OBJECT, elementProps],
      stateAttributesMapping: stateAttributesMapping
    })
  }), portalContainer);
});
if (process.env.NODE_ENV !== "production") NavigationMenuContent.displayName = "NavigationMenuContent";