"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccordionRootContext = void 0;
exports.useAccordionRootContext = useAccordionRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const AccordionRootContext = exports.AccordionRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") AccordionRootContext.displayName = "AccordionRootContext";
function useAccordionRootContext() {
  const context = React.useContext(AccordionRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.' : (0, _formatErrorMessage2.default)(10));
  }
  return context;
}