"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRenderDialogRoot = useRenderDialogRoot;
var React = _interopRequireWildcard(require("react"));
var _useDialogRoot = require("./useDialogRoot");
var _DialogRootContext = require("./DialogRootContext");
var _DialogStore = require("../store/DialogStore");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _popups = require("../../utils/popups");
var _jsxRuntime = require("react/jsx-runtime");
function useRenderDialogRoot(mode, props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    disablePointerDismissal: disablePointerDismissalProp = false,
    modal: modalProp = true,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null
  } = props;
  const isDrawer = mode === 'drawer';
  const isAlertDialog = mode === 'alert-dialog';
  const modal = isAlertDialog ? true : modalProp;
  const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp;
  const role = isAlertDialog ? 'alertdialog' : 'dialog';
  const parentStore = (0, _DialogRootContext.useDialogRootContext)(true);
  const nested = parentStore != null;
  const rootState = {
    modal,
    disablePointerDismissal,
    nested,
    role
  };

  // The store is owned by this Root instance and created exactly once. It is not tied to the handle:
  // the handle attaches to it, so swapping the handle re-attaches rather than recreating state.
  // Default values are only initial values; controlled values and root state are synced after creation.
  // Dialogs pass the popup element to Floating UI as the floating element (`treatPopupAsFloatingElement`).
  const store = (0, _popups.usePopupRootStore)((floatingId, floatingNested) => new _DialogStore.DialogStore({
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp,
    ...rootState
  }, floatingId, floatingNested), true);
  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);
  store.useSyncedValues(rootState);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload');
  (0, _popups.usePopupRootSync)(store, open);
  (0, _popups.useImplicitActiveTrigger)(store);
  const {
    forceUnmount
  } = (0, _popups.useOpenStateTransitions)(open, store);
  React.useImperativeHandle(actionsRef, () => ({
    unmount: forceUnmount,
    close: () => store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.imperativeAction))
  }), [forceUnmount, store]);
  const shouldRenderInteractions = open || mounted;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_DialogRootContext.DialogRootContext.Provider, {
    value: store,
    children: [handle && /*#__PURE__*/(0, _jsxRuntime.jsx)(_popups.PopupHandleAttachment, {
      handle: handle,
      store: store
    }), shouldRenderInteractions && /*#__PURE__*/(0, _jsxRuntime.jsx)(_useDialogRoot.DialogInteractions, {
      store: store,
      parentContext: parentStore?.context,
      isDrawer: isDrawer
    }), typeof children === 'function' ? children({
      payload
    }) : children]
  });
}