"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabsListContext = void 0;
exports.useTabsListContext = useTabsListContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const TabsListContext = exports.TabsListContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TabsListContext.displayName = "TabsListContext";
function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.' : (0, _formatErrorMessage2.default)(65));
  }
  return context;
}