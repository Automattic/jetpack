"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _floatingUiReact = require("../../floating-ui-react");
var _PopoverRootContext = require("../root/PopoverRootContext");
var _PopoverPositionerContext = require("../positioner/PopoverPositionerContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useRenderElement = require("../../internals/useRenderElement");
var _reasons = require("../../internals/reasons");
var _composite = require("../../internals/composite/composite");
var _ToolbarRootContext = require("../../toolbar/root/ToolbarRootContext");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
var _closePart = require("../../utils/closePart");
var _popups = require("../../utils/popups");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverPopup = exports.PopoverPopup = /*#__PURE__*/React.forwardRef(function PopoverPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    initialFocus,
    finalFocus,
    ...elementProps
  } = componentProps;
  const store = (0, _PopoverRootContext.usePopoverRootContext)();
  const positioner = (0, _PopoverPositionerContext.usePopoverPositionerContext)();
  const insideToolbar = (0, _ToolbarRootContext.useToolbarRootContext)(true) != null;
  const {
    context: closePartContext,
    hasClosePart
  } = (0, _closePart.useClosePartCount)();
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const titleId = store.useState('titleElementId');
  const descriptionId = store.useState('descriptionElementId');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const openReason = store.useState('openChangeReason');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const floatingContext = store.useState('floatingRootContext');
  const floatingId = floatingContext.useState('floatingId');
  const disabled = store.useState('disabled');
  const openOnHover = store.useState('openOnHover');
  const closeDelay = store.useState('closeDelay');
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    }
  });
  (0, _floatingUiReact.useHoverFloatingInteraction)(floatingContext, {
    enabled: openOnHover && !disabled,
    closeDelay
  });
  const resolvedInitialFocus = initialFocus === undefined ? (0, _popups.createDefaultInitialFocus)(store.context.popupRef) : initialFocus;
  const focusManagerModal = modal !== false && hasClosePart;
  store.useSyncedValue('focusManagerModal', focusManagerModal);
  const setPopupElement = store.useStateSetter('popupElement');
  const state = {
    open,
    side: positioner.side,
    align: positioner.align,
    instant: instantType,
    transitionStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    props: [popupProps, {
      id: floatingId,
      role: 'dialog',
      ..._popups.FOCUSABLE_POPUP_PROPS,
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
      onKeyDown(event) {
        if (insideToolbar && _composite.COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }
      }
    }, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps],
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
    context: floatingContext,
    openInteractionType: openMethod,
    modal: focusManagerModal,
    disabled: !mounted || openReason === _reasons.REASONS.triggerHover,
    initialFocus: resolvedInitialFocus,
    returnFocus: finalFocus,
    restoreFocus: "popup",
    previousFocusableElement: (0, _dom.isHTMLElement)(activeTriggerElement) ? activeTriggerElement : undefined,
    nextFocusableElement: store.context.triggerFocusTargetRef,
    beforeContentFocusGuardRef: store.context.beforeContentFocusGuardRef,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_closePart.ClosePartContext.Provider, {
      value: closePartContext,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") PopoverPopup.displayName = "PopoverPopup";