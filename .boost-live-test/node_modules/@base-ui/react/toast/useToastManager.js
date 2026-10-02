"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useToastManager = useToastManager;
var React = _interopRequireWildcard(require("react"));
var _ToastProviderContext = require("./provider/ToastProviderContext");
/**
 * Returns the array of toasts and methods to manage them.
 */
function useToastManager() {
  const store = (0, _ToastProviderContext.useToastProviderContext)();
  const toasts = store.useState('toasts');
  return React.useMemo(() => ({
    toasts,
    add: store.addToast,
    close: store.closeToast,
    update: store.updateToast,
    promise: store.promiseToast
  }), [toasts, store]);
}