"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuItem = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _NavigationMenuItemContext = require("./NavigationMenuItemContext");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * An individual navigation menu item.
 * Renders a `<li>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuItem = exports.NavigationMenuItem = /*#__PURE__*/React.forwardRef(function NavigationMenuItem(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    value: valueProp,
    ...elementProps
  } = componentProps;
  const fallbackValue = (0, _useBaseUiId.useBaseUiId)();
  const value = valueProp ?? fallbackValue;
  const element = (0, _useRenderElement.useRenderElement)('li', componentProps, {
    ref: forwardedRef,
    props: elementProps
  });
  const contextValue = React.useMemo(() => ({
    value
  }), [value]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_NavigationMenuItemContext.NavigationMenuItemContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") NavigationMenuItem.displayName = "NavigationMenuItem";