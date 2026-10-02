"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScrollAreaScrollbarContext = void 0;
exports.useScrollAreaScrollbarContext = useScrollAreaScrollbarContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ScrollAreaScrollbarContext = exports.ScrollAreaScrollbarContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ScrollAreaScrollbarContext.displayName = "ScrollAreaScrollbarContext";
function useScrollAreaScrollbarContext() {
  const context = React.useContext(ScrollAreaScrollbarContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ScrollAreaScrollbarContext is missing. ScrollAreaScrollbar parts must be placed within <ScrollArea.Scrollbar>.' : (0, _formatErrorMessage2.default)(54));
  }
  return context;
}