"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _useOnMount = require("@base-ui/utils/useOnMount");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _ToastProviderContext = require("./ToastProviderContext");
var _store = require("../store");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastProvider = exports.ToastProvider = function ToastProvider(props) {
  const {
    children,
    timeout = 5000,
    limit = 3,
    toastManager
  } = props;
  const store = (0, _useRefWithInit.useRefWithInit)(() => new _store.ToastStore({
    timeout,
    limit,
    viewport: null,
    toasts: [],
    hovering: false,
    focused: false,
    isWindowFocused: true,
    prevFocusElement: null
  })).current;
  (0, _useOnMount.useOnMount)(store.disposeEffect);
  React.useEffect(function subscribeToToastManager() {
    if (!toastManager) {
      return undefined;
    }
    const unsubscribe = toastManager[' subscribe'](({
      action,
      options
    }) => {
      const id = options.id;
      if (action === 'promise' && options.promise) {
        store.promiseToast(options.promise, options);
      } else if (action === 'update' && id) {
        store.updateToast(id, options.updates);
      } else if (action === 'close') {
        store.closeToast(id);
      } else {
        store.addToast(options);
      }
    });
    return unsubscribe;
  }, [store, toastManager]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_ToastProviderContext.ToastContext.Provider, {
    value: store,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ToastProviderPropsSynchronizer, {
      store: store,
      timeout: timeout,
      limit: limit
    }), children]
  });
};
if (process.env.NODE_ENV !== "production") ToastProvider.displayName = "ToastProvider";
function ToastProviderPropsSynchronizer(props) {
  const {
    store,
    timeout,
    limit
  } = props;

  // `limit` needs custom syncing because changing it must also recompute each
  // toast's `limited` flag; `useSyncedValues` would only update the raw value.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    store.syncProviderProps(timeout, limit);
  }, [store, timeout, limit]);
  return null;
}