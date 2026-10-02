"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _DialogRootContext = require("../root/DialogRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _DialogPortalContext = require("../portal/DialogPortalContext");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _composite = require("../../internals/composite/composite");
var _popups = require("../../utils/popups");
var DialogPopupCssVars = _interopRequireWildcard(require("./DialogPopupCssVars"));
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A container for the dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogPopup = exports.DialogPopup = /*#__PURE__*/React.forwardRef(function DialogPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    finalFocus,
    initialFocus,
    ...elementProps
  } = componentProps;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const descriptionElementId = store.useState('descriptionElementId');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const floatingRootContext = store.useState('floatingRootContext');
  const rootPopupProps = store.useState('popupProps');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const titleElementId = store.useState('titleElementId');
  const transitionStatus = store.useState('transitionStatus');
  const role = store.useState('role');
  const floatingId = floatingRootContext.useState('floatingId');
  (0, _DialogPortalContext.useDialogPortalContext)();
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    }
  });
  const resolvedInitialFocus = initialFocus === undefined ? (0, _popups.createDefaultInitialFocus)(store.context.popupRef) : initialFocus;
  const nestedDialogOpen = nestedOpenDialogCount > 0;
  const setPopupElement = store.useStateSetter('popupElement');
  const state = {
    open,
    nested,
    transitionStatus,
    nestedDialogOpen
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    props: [rootPopupProps, {
      id: floatingId,
      'aria-labelledby': titleElementId,
      'aria-describedby': descriptionElementId,
      role,
      ..._popups.FOCUSABLE_POPUP_PROPS,
      hidden: !mounted,
      onKeyDown(event) {
        if (_composite.COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }
      },
      style: {
        [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount
      }
    }, elementProps],
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    stateAttributesMapping: _stateAttributesMapping.dialogStateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
    context: floatingRootContext,
    openInteractionType: openMethod,
    disabled: !mounted,
    closeOnFocusOut: !disablePointerDismissal,
    initialFocus: resolvedInitialFocus,
    returnFocus: finalFocus,
    modal: modal !== false,
    restoreFocus: "popup",
    children: element
  });
});
if (process.env.NODE_ENV !== "production") DialogPopup.displayName = "DialogPopup";