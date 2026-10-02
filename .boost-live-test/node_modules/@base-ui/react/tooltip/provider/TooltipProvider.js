"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _TooltipProviderContext = require("./TooltipProviderContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Provides a shared delay for multiple tooltips. The grouping logic ensures that
 * once a tooltip becomes visible, the adjacent tooltips will be shown instantly.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipProvider = exports.TooltipProvider = function TooltipProvider(props) {
  const {
    delay,
    closeDelay,
    timeout = 400
  } = props;
  const delayValue = React.useMemo(() => ({
    open: delay,
    close: closeDelay
  }), [delay, closeDelay]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TooltipProviderContext.TooltipProviderContext.Provider, {
    value: delay,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingDelayGroup, {
      delay: delayValue,
      timeoutMs: timeout,
      children: props.children
    })
  });
};
if (process.env.NODE_ENV !== "production") TooltipProvider.displayName = "TooltipProvider";