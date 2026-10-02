"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuSubmenuRoot = MenuSubmenuRoot;
Object.defineProperty(exports, "useMenuSubmenuRootContext", {
  enumerable: true,
  get: function () {
    return _MenuSubmenuRootContext.useMenuSubmenuRootContext;
  }
});
var React = _interopRequireWildcard(require("react"));
var _MenuRoot = require("../root/MenuRoot");
var _MenuRootContext = require("../root/MenuRootContext");
var _MenuSubmenuRootContext = require("./MenuSubmenuRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
function MenuSubmenuRoot(props) {
  const parentMenu = (0, _MenuRootContext.useMenuRootContext)().store;
  const contextValue = React.useMemo(() => ({
    parentMenu
  }), [parentMenu]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenuSubmenuRootContext.MenuSubmenuRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenuRoot.MenuRoot, {
      ...props
    })
  });
}