"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardPortalContext = void 0;
exports.usePreviewCardPortalContext = usePreviewCardPortalContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const PreviewCardPortalContext = exports.PreviewCardPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PreviewCardPortalContext.displayName = "PreviewCardPortalContext";
function usePreviewCardPortalContext() {
  const value = React.useContext(PreviewCardPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <PreviewCard.Portal> is missing.' : (0, _formatErrorMessage2.default)(48));
  }
  return value;
}