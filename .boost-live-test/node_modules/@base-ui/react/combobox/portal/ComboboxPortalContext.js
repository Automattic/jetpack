"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxPortalContext = void 0;
exports.useComboboxPortalContext = useComboboxPortalContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ComboboxPortalContext = exports.ComboboxPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxPortalContext.displayName = "ComboboxPortalContext";
function useComboboxPortalContext() {
  const context = React.useContext(ComboboxPortalContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Combobox.Portal> is missing.' : (0, _formatErrorMessage2.default)(20));
  }
  return context;
}