"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccordionItemContext = void 0;
exports.useAccordionItemContext = useAccordionItemContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const AccordionItemContext = exports.AccordionItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") AccordionItemContext.displayName = "AccordionItemContext";
function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.' : (0, _formatErrorMessage2.default)(9));
  }
  return context;
}