"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverRoot = PopoverRoot;
var React = _interopRequireWildcard(require("react"));
var _fastHooks = require("@base-ui/utils/fastHooks");
var _floatingUiReact = require("../../floating-ui-react");
var _PopoverRootContext = require("./PopoverRootContext");
var _PopoverStore = require("../store/PopoverStore");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _popups = require("../../utils/popups");
var _jsxRuntime = require("react/jsx-runtime");
const PopoverRootComponent = (0, _fastHooks.fastComponent)(function PopoverRootComponent({
  props
}) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    modal = false,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null
  } = props;
  const store = usePopoverRootStore(handle, {
    modal,
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp
  });
  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload');
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);
  (0, _popups.usePopupRootSync)(store, open);
  (0, _popups.useImplicitActiveTrigger)(store);
  const {
    forceUnmount
  } = (0, _popups.useOpenStateTransitions)(open, store, () => {
    store.update({
      stickIfOpen: true,
      openChangeReason: null
    });
  });
  store.useSyncedValues({
    modal
  });
  React.useEffect(() => {
    if (!open) {
      store.context.stickIfOpenTimeout.clear();
    }
  }, [store, open]);
  React.useImperativeHandle(props.actionsRef, () => ({
    unmount: forceUnmount,
    close: () => store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.imperativeAction))
  }), [forceUnmount, store]);
  const shouldRenderInteractions = open || mounted;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PopoverRootContext.PopoverRootContext.Provider, {
    value: store,
    children: [handle && /*#__PURE__*/(0, _jsxRuntime.jsx)(_popups.PopupHandleAttachment, {
      handle: handle,
      store: store
    }), shouldRenderInteractions && /*#__PURE__*/(0, _jsxRuntime.jsx)(PopoverInteractions, {
      store: store,
      modal: modal
    }), typeof children === 'function' ? children({
      payload
    }) : children]
  });
});

/**
 * Groups all parts of the popover.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
if (process.env.NODE_ENV !== "production") PopoverRootComponent.displayName = "PopoverRootComponent";
function PopoverRoot(props) {
  if ((0, _PopoverRootContext.usePopoverRootContext)(true)) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(PopoverRootComponent, {
      props: props
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingTree, {
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(PopoverRootComponent, {
      props: props
    })
  });
}
function usePopoverRootStore(handle, initialState) {
  // The store is owned by this Root instance and created exactly once. It is not tied to the handle:
  // the handle attaches to it, so swapping the handle re-attaches rather than recreating state.
  // Default values are only initial values; controlled values and root state are synced after creation.
  const store = (0, _popups.usePopupRootStore)((floatingId, nested) => new _PopoverStore.PopoverStore(initialState, floatingId, nested));

  // Popover-specific: dispose the patient-click timeout held in the store's context on unmount.
  React.useEffect(() => store.context.stickIfOpenTimeout.disposeEffect(), [store]);
  return store;
}
function PopoverInteractions({
  store,
  modal
}) {
  const floatingRootContext = store.useState('floatingRootContext');
  const dismiss = (0, _floatingUiReact.useDismiss)(floatingRootContext, {
    outsidePressEvent: {
      // Ensure `aria-hidden` on outside elements is removed immediately
      // on outside press when trapping focus.
      mouse: modal === 'trap-focus' ? 'sloppy' : 'intentional',
      touch: 'sloppy'
    }
  });

  // `useDismiss` is not given an `enabled` option, so it always returns both prop bags. Restore
  // the `EMPTY_OBJECT` fallbacks if that ever changes: the store fields are non-optional.
  // `dismiss.trigger` is always the same object as `dismiss.reference`.
  const triggerProps = dismiss.reference;
  // PopoverPopup already spreads `FOCUSABLE_POPUP_PROPS` directly, so the popup
  // props only need to carry the dismiss handlers.
  const popupProps = dismiss.floating;
  (0, _popups.usePopupInteractionProps)(store, {
    activeTriggerProps: triggerProps,
    inactiveTriggerProps: triggerProps,
    popupProps
  });
  return null;
}