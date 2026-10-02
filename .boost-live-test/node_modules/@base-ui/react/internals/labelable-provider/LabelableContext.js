"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LabelableContext = void 0;
exports.useLabelableContext = useLabelableContext;
var React = _interopRequireWildcard(require("react"));
var _noop = require("../noop");
/**
 * A context for providing [labelable elements](https://html.spec.whatwg.org/multipage/forms.html#category-label)\
 * with an accessible name (label) and description.
 */
const LabelableContext = exports.LabelableContext = /*#__PURE__*/React.createContext({
  controlId: undefined,
  registerControlId: _noop.NOOP,
  resetControlId: _noop.NOOP,
  labelId: undefined,
  setLabelId: _noop.NOOP,
  messageIds: [],
  setMessageIds: _noop.NOOP,
  getDescriptionProps: externalProps => externalProps
});
if (process.env.NODE_ENV !== "production") LabelableContext.displayName = "LabelableContext";
function useLabelableContext() {
  return React.useContext(LabelableContext);
}