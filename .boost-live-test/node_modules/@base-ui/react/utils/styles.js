"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.styleDisableScrollbar = void 0;
var _jsxRuntime = require("react/jsx-runtime");
const DISABLE_SCROLLBAR_CLASS_NAME = 'base-ui-disable-scrollbar';
const styleDisableScrollbar = exports.styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  getElement(nonce) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("style", {
      nonce: nonce,
      href: DISABLE_SCROLLBAR_CLASS_NAME,
      precedence: "base-ui:low",
      children: `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`
    });
  }
};
if (process.env.NODE_ENV !== "production") styleDisableScrollbar.getElement.displayName = "styleDisableScrollbar.getElement";