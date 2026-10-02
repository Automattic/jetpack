"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogPortalContext = void 0;
exports.useDialogPortalContext = useDialogPortalContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const DialogPortalContext = exports.DialogPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DialogPortalContext.displayName = "DialogPortalContext";
function useDialogPortalContext() {
  const value = React.useContext(DialogPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Dialog.Portal> is missing.' : (0, _formatErrorMessage2.default)(26));
  }
  return value;
}