"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ClosePartContext = void 0;
exports.useClosePartCount = useClosePartCount;
exports.useClosePartRegistration = useClosePartRegistration;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
const ClosePartContext = exports.ClosePartContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ClosePartContext.displayName = "ClosePartContext";
function useClosePartCount() {
  const [closePartCount, setClosePartCount] = React.useState(0);
  const register = (0, _useStableCallback.useStableCallback)(() => {
    setClosePartCount(count => count + 1);
    return () => {
      setClosePartCount(count => Math.max(0, count - 1));
    };
  });
  const context = React.useMemo(() => ({
    register
  }), [register]);
  return {
    context,
    hasClosePart: closePartCount > 0
  };
}
function useClosePartRegistration() {
  const context = React.useContext(ClosePartContext);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    return context?.register();
  }, [context]);
}