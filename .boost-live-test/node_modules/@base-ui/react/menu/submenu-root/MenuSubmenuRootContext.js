"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuSubmenuRootContext = void 0;
exports.useMenuSubmenuRootContext = useMenuSubmenuRootContext;
var React = _interopRequireWildcard(require("react"));
const MenuSubmenuRootContext = exports.MenuSubmenuRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuSubmenuRootContext.displayName = "MenuSubmenuRootContext";
function useMenuSubmenuRootContext() {
  return React.useContext(MenuSubmenuRootContext);
}