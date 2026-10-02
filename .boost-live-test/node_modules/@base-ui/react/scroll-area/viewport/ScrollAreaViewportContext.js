"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScrollAreaViewportContext = void 0;
exports.useScrollAreaViewportContext = useScrollAreaViewportContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ScrollAreaViewportContext = exports.ScrollAreaViewportContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ScrollAreaViewportContext.displayName = "ScrollAreaViewportContext";
function useScrollAreaViewportContext() {
  const context = React.useContext(ScrollAreaViewportContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.' : (0, _formatErrorMessage2.default)(55));
  }
  return context;
}