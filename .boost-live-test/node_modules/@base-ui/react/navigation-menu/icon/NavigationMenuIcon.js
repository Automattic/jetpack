"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuIcon = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _NavigationMenuItemContext = require("../item/NavigationMenuItemContext");
/**
 * An icon that indicates that the trigger button opens a menu.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuIcon = exports.NavigationMenuIcon = /*#__PURE__*/React.forwardRef(function NavigationMenuIcon(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    value: itemValue
  } = (0, _NavigationMenuItemContext.useNavigationMenuItemContext)();
  const {
    open,
    value
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const isActiveItem = open && value === itemValue;
  const state = {
    open: isActiveItem
  };
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: '▼'
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuIcon.displayName = "NavigationMenuIcon";