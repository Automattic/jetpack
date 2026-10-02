"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompositeListContext = void 0;
exports.useCompositeListContext = useCompositeListContext;
var React = _interopRequireWildcard(require("react"));
const CompositeListContext = exports.CompositeListContext = /*#__PURE__*/React.createContext({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => () => {},
  nextIndexRef: {
    current: 0
  }
});
if (process.env.NODE_ENV !== "production") CompositeListContext.displayName = "CompositeListContext";
function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}