"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _fastHooks = require("@base-ui/utils/fastHooks");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _floatingUiReact = require("../../floating-ui-react");
var _PreviewCardContext = require("./PreviewCardContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _PreviewCardStore = require("../store/PreviewCardStore");
var _popups = require("../../utils/popups");
var _jsxRuntime = require("react/jsx-runtime");
function PreviewCardRootComponent(props) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    children
  } = props;
  const store = (0, _popups.usePopupRootStore)((floatingId, nested) => new _PreviewCardStore.PreviewCardStore({
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp
  }, floatingId, nested));
  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);
  const open = store.useState('open');
  const activeTriggerId = store.useState('activeTriggerId');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload');
  (0, _popups.useImplicitActiveTrigger)(store, {
    closeOnActiveTriggerUnmount: true
  });
  const {
    forceUnmount
  } = (0, _popups.useOpenStateTransitions)(open, store, () => {
    store.context.inlineRectCoordsRef.current = undefined;
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open) {
      if (activeTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, activeTriggerId, open]);
  React.useImperativeHandle(actionsRef, () => ({
    unmount: forceUnmount,
    close: () => store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.imperativeAction))
  }), [forceUnmount, store]);
  const shouldRenderInteractions = open || mounted;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PreviewCardContext.PreviewCardRootContext.Provider, {
    value: store,
    children: [handle && /*#__PURE__*/(0, _jsxRuntime.jsx)(_popups.PopupHandleAttachment, {
      handle: handle,
      store: store
    }), shouldRenderInteractions && /*#__PURE__*/(0, _jsxRuntime.jsx)(PreviewCardInteractions, {
      store: store
    }), typeof children === 'function' ? children({
      payload
    }) : children]
  });
}
function PreviewCardInteractions({
  store
}) {
  const floatingRootContext = store.useState('floatingRootContext');
  const dismiss = (0, _floatingUiReact.useDismiss)(floatingRootContext);

  // `useDismiss` is not given an `enabled` option, so all three prop bags are always defined.
  // `dismiss.trigger` is the same object as `dismiss.reference`.
  (0, _popups.usePopupInteractionProps)(store, {
    activeTriggerProps: dismiss.reference,
    inactiveTriggerProps: dismiss.trigger,
    popupProps: dismiss.floating
  });
  return null;
}

/**
 * Groups all parts of the preview card.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardRoot = exports.PreviewCardRoot = (0, _fastHooks.fastComponent)(function PreviewCardRoot(props) {
  if ((0, _PreviewCardContext.usePreviewCardRootContext)(true)) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(PreviewCardRootComponent, {
      ...props
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingTree, {
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(PreviewCardRootComponent, {
      ...props
    })
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardRoot.displayName = "PreviewCardRoot";