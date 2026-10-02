"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _TooltipRootContext = require("../root/TooltipRootContext");
var _TooltipPositionerContext = require("../positioner/TooltipPositionerContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useRenderElement = require("../../internals/useRenderElement");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
var _floatingUiReact = require("../../floating-ui-react");
var _popups = require("../../utils/popups");
/**
 * A container for the tooltip contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipPopup = exports.TooltipPopup = /*#__PURE__*/React.forwardRef(function TooltipPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _TooltipRootContext.useTooltipRootContext)();
  const {
    side,
    align
  } = (0, _TooltipPositionerContext.useTooltipPositionerContext)();
  const open = store.useState('open');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const floatingContext = store.useState('floatingRootContext');
  const disabled = store.useState('disabled');
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
    enabled: !disabled,
    closeDelay
  });
  const setPopupElement = store.useStateSetter('popupElement');
  const state = {
    open,
    side,
    align,
    instant: instantType,
    transitionStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    props: [_popups.FOCUSABLE_POPUP_PROPS, popupProps, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps],
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") TooltipPopup.displayName = "TooltipPopup";