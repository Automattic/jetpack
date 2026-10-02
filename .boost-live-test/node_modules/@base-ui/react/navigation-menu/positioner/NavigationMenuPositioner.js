"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuPositioner = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _mergeCleanups = require("@base-ui/utils/mergeCleanups");
var _owner = require("@base-ui/utils/owner");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _utils = require("../../floating-ui-react/utils");
var _getEmptyRootContext = require("../../floating-ui-react/utils/getEmptyRootContext");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _NavigationMenuPortalContext = require("../portal/NavigationMenuPortalContext");
var _useNavigationMenuAnchorPositioning = require("../utils/useNavigationMenuAnchorPositioning");
var _NavigationMenuPositionerContext = require("./NavigationMenuPositionerContext");
var _constants = require("../../internals/constants");
var _adaptiveOriginMiddleware = require("../../utils/adaptiveOriginMiddleware");
var _usePositioner = require("../../utils/usePositioner");
var _jsxRuntime = require("react/jsx-runtime");
const EMPTY_ROOT_CONTEXT = (0, _getEmptyRootContext.getEmptyRootContext)();

/**
 * Positions the navigation menu against the currently active trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuPositioner = exports.NavigationMenuPositioner = /*#__PURE__*/React.forwardRef(function NavigationMenuPositioner(componentProps, forwardedRef) {
  const {
    open,
    mounted,
    positionerElement,
    setPositionerElement,
    floatingRootContext,
    nested,
    transitionStatus
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const {
    className,
    render,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    collisionAvoidance = nested ? _constants.POPUP_COLLISION_AVOIDANCE : _constants.DROPDOWN_COLLISION_AVOIDANCE,
    arrowPadding = 5,
    sticky = false,
    disableAnchorTracking = false,
    style,
    ...elementProps
  } = componentProps;
  const keepMounted = (0, _NavigationMenuPortalContext.useNavigationMenuPortalContext)();
  const nodeId = (0, _NavigationMenuRootContext.useNavigationMenuTreeContext)();
  const initialInstantTimeout = (0, _useTimeout.useTimeout)();
  const resizeTimeout = (0, _useTimeout.useTimeout)();

  // When the menu is initially open, disable the positioner's transition for one frame
  // so a default value does not animate in from the unpositioned portal state.
  const [instant, setInstant] = React.useState(open);
  const needsInitialInstantResetRef = React.useRef(open);

  // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
  React.useEffect(() => {
    if (!positionerElement) {
      return undefined;
    }

    // Make sure elements inside the portal element are tabbable only when the
    // portal has already been focused, either by tabbing into a focus trap
    // element outside or using the mouse.
    function onFocus(event) {
      if (positionerElement && (0, _utils.isOutsideEvent)(event)) {
        const focusing = event.type === 'focusin';
        const manageFocus = focusing ? _utils.enableFocusInside : _utils.disableFocusInside;
        manageFocus(positionerElement);
      }
    }

    // Listen to the event on the capture phase so they run before the focus
    // trap elements onFocus prop is called.
    return (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(positionerElement, 'focusin', onFocus, true), (0, _addEventListener.addEventListener)(positionerElement, 'focusout', onFocus, true));
  }, [positionerElement]);
  const domReference = (floatingRootContext || EMPTY_ROOT_CONTEXT).useState('domReferenceElement');
  const positioning = (0, _useNavigationMenuAnchorPositioning.useNavigationMenuAnchorPositioning)({
    anchor: anchor ?? domReference,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    disableAnchorTracking,
    keepMounted,
    floatingRootContext,
    collisionAvoidance,
    shift: {
      rootBoundary: 'layoutViewport'
    },
    nodeId,
    // Allows the menu to remain anchored without wobbling while its size
    // and position transition simultaneously when side=top or side=left.
    adaptiveOrigin: _adaptiveOriginMiddleware.adaptiveOrigin
  });
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    instant
  };
  React.useEffect(() => {
    if (!open) {
      return undefined;
    }
    if (needsInitialInstantResetRef.current) {
      initialInstantTimeout.start(0, () => {
        needsInitialInstantResetRef.current = false;
        if (!resizeTimeout.isStarted()) {
          setInstant(false);
        }
      });
    }
    function handleResize() {
      ReactDOM.flushSync(() => {
        setInstant(true);
      });
      resizeTimeout.start(100, () => {
        setInstant(false);
      });
    }
    const win = (0, _owner.ownerWindow)(positionerElement);
    return (0, _addEventListener.addEventListener)(win, 'resize', handleResize);
  }, [open, initialInstantTimeout, resizeTimeout, positionerElement]);
  const element = (0, _usePositioner.usePositioner)(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_NavigationMenuPositionerContext.NavigationMenuPositionerContext.Provider, {
    value: positioning,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") NavigationMenuPositioner.displayName = "NavigationMenuPositioner";