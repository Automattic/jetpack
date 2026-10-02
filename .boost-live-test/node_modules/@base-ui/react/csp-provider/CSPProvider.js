"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CSPProvider = CSPProvider;
var React = _interopRequireWildcard(require("react"));
var _CSPContext = require("../internals/csp-context/CSPContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Provides a default Content Security Policy (CSP) configuration for Base UI components that
 * require inline `<style>` or `<script>` tags.
 *
 * Documentation: [Base UI CSP Provider](https://base-ui.com/react/utils/csp-provider)
 */
function CSPProvider(props) {
  const {
    children,
    nonce,
    disableStyleElements
  } = props;
  const contextValue = React.useMemo(() => ({
    nonce,
    disableStyleElements
  }), [nonce, disableStyleElements]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CSPContext.CSPContext.Provider, {
    value: contextValue,
    children: children
  });
}