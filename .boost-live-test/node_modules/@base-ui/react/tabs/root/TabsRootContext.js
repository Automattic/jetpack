"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabsRootContext = void 0;
exports.useTabsRootContext = useTabsRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
/**
 * @internal
 */
const TabsRootContext = exports.TabsRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TabsRootContext.displayName = "TabsRootContext";
function useTabsRootContext() {
  const context = React.useContext(TabsRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.' : (0, _formatErrorMessage2.default)(64));
  }
  return context;
}