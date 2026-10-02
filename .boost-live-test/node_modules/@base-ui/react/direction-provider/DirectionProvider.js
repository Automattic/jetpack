"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DirectionProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _DirectionContext = require("../internals/direction-context/DirectionContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Enables RTL behavior for Base UI components.
 *
 * Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
 */
const DirectionProvider = exports.DirectionProvider = function DirectionProvider(props) {
  const {
    direction = 'ltr'
  } = props;
  const contextValue = React.useMemo(() => ({
    direction
  }), [direction]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_DirectionContext.DirectionContext.Provider, {
    value: contextValue,
    children: props.children
  });
};
if (process.env.NODE_ENV !== "production") DirectionProvider.displayName = "DirectionProvider";