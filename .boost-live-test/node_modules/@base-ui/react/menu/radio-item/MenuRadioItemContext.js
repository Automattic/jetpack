"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuRadioItemContext = void 0;
exports.useMenuRadioItemContext = useMenuRadioItemContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const MenuRadioItemContext = exports.MenuRadioItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuRadioItemContext.displayName = "MenuRadioItemContext";
function useMenuRadioItemContext() {
  const context = React.useContext(MenuRadioItemContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MenuRadioItemContext is missing. MenuRadioItem parts must be placed within <Menu.RadioItem>.' : (0, _formatErrorMessage2.default)(35));
  }
  return context;
}