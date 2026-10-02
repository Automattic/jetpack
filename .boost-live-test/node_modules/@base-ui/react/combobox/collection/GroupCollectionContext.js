"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GroupCollectionProvider = GroupCollectionProvider;
exports.useGroupCollectionContext = useGroupCollectionContext;
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
const GroupCollectionContext = /*#__PURE__*/React.createContext(null);
if (process.env.NODE_ENV !== "production") GroupCollectionContext.displayName = "GroupCollectionContext";
function useGroupCollectionContext() {
  return React.useContext(GroupCollectionContext);
}
function GroupCollectionProvider(props) {
  const {
    children,
    items
  } = props;
  const contextValue = React.useMemo(() => ({
    items
  }), [items]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(GroupCollectionContext.Provider, {
    value: contextValue,
    children: children
  });
}