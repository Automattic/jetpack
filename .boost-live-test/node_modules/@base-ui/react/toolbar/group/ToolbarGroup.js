"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToolbarGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ToolbarRootContext = require("../root/ToolbarRootContext");
var _ToolbarGroupContext = require("./ToolbarGroupContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups several toolbar items or toggles.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarGroup = exports.ToolbarGroup = /*#__PURE__*/React.forwardRef(function ToolbarGroup(componentProps, forwardedRef) {
  const {
    className,
    disabled: disabledProp = false,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    orientation,
    disabled: toolbarDisabled
  } = (0, _ToolbarRootContext.useToolbarRootContext)();
  const disabled = toolbarDisabled || disabledProp;
  const contextValue = React.useMemo(() => ({
    disabled
  }), [disabled]);
  const state = {
    disabled,
    orientation
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'group'
    }, elementProps]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ToolbarGroupContext.ToolbarGroupContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ToolbarGroup.displayName = "ToolbarGroup";