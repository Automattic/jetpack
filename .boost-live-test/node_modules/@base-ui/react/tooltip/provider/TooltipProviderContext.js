"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipProviderContext = void 0;
exports.useTooltipProviderContext = useTooltipProviderContext;
var React = _interopRequireWildcard(require("react"));
/**
 * Holds the provider's `delay` value. `closeDelay` is handled by the delay group.
 */
const TooltipProviderContext = exports.TooltipProviderContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TooltipProviderContext.displayName = "TooltipProviderContext";
function useTooltipProviderContext() {
  return React.useContext(TooltipProviderContext);
}