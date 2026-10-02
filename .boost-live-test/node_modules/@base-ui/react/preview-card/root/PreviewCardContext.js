"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardRootContext = void 0;
exports.usePreviewCardRootContext = usePreviewCardRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const PreviewCardRootContext = exports.PreviewCardRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PreviewCardRootContext.displayName = "PreviewCardRootContext";
function usePreviewCardRootContext(optional) {
  const context = React.useContext(PreviewCardRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.' : (0, _formatErrorMessage2.default)(50));
  }
  return context;
}