"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _PreviewCardContext = require("../root/PreviewCardContext");
var _PreviewCardPositionerContext = require("../positioner/PreviewCardPositionerContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useRenderElement = require("../../internals/useRenderElement");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
var _floatingUiReact = require("../../floating-ui-react");
var _popups = require("../../utils/popups");
/**
 * A container for the preview card contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardPopup = exports.PreviewCardPopup = /*#__PURE__*/React.forwardRef(function PreviewCardPopup(componentProps, forwardedRef) {
  const {
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _PreviewCardContext.usePreviewCardRootContext)();
  const {
    side,
    align
  } = (0, _PreviewCardPositionerContext.usePreviewCardPositionerContext)();
  const open = store.useState('open');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const floatingContext = store.useState('floatingRootContext');
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
    closeDelay
  });
  const state = {
    open,
    side,
    align,
    instant: instantType,
    transitionStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, store.useStateSetter('popupElement')],
    props: [_popups.FOCUSABLE_POPUP_PROPS, popupProps, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps],
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PreviewCardPopup.displayName = "PreviewCardPopup";