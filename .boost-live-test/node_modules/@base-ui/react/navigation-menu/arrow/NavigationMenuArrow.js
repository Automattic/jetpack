"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _NavigationMenuPositionerContext = require("../positioner/NavigationMenuPositionerContext");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
/**
 * Displays an element pointing toward the navigation menu's current anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuArrow = exports.NavigationMenuArrow = /*#__PURE__*/React.forwardRef(function NavigationMenuArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    open,
    transitionStatus
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _NavigationMenuPositionerContext.useNavigationMenuPositionerContext)();
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{
      style: arrowStyles,
      'aria-hidden': true
    }, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps],
    stateAttributesMapping: _popupStateMapping.popupStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuArrow.displayName = "NavigationMenuArrow";