"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogRootContext = void 0;
exports.useDialogRootContext = useDialogRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const DialogRootContext = exports.DialogRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DialogRootContext.displayName = "DialogRootContext";
function useDialogRootContext(optional) {
  const store = React.useContext(DialogRootContext);
  if (!optional && store === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.' : (0, _formatErrorMessage2.default)(27));
  }
  return store;
}