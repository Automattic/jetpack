"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _floatingUiReact = require("../../floating-ui-react");
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _ComboboxPositionerContext = require("../positioner/ComboboxPositionerContext");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _utils = require("../../floating-ui-react/utils");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
var _ComboboxInternalDismissButton = require("../utils/ComboboxInternalDismissButton");
var _utils2 = require("../root/utils");
var _parts = require("../utils/parts");
var _jsxRuntime = require("react/jsx-runtime");
const stateAttributesMapping = {
  ..._popupStateMapping.popupStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};

/**
 * A container for the list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxPopup = exports.ComboboxPopup = /*#__PURE__*/React.forwardRef(function ComboboxPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    initialFocus,
    finalFocus,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const positioning = (0, _ComboboxPositionerContext.useComboboxPositionerContext)();
  const floatingRootContext = (0, _ComboboxRootContext.useComboboxFloatingContext)();
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const popupProps = store.useState('popupProps');
  const transitionStatus = store.useState('transitionStatus');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const inputElement = store.useState('inputElement');
  const modal = store.useState('modal');
  const rootId = store.useState('id');
  const empty = (0, _parts.useListEmpty)();
  const popupId = elementProps.id ?? (inputInsidePopup ? (0, _utils2.getComboboxPopupId)(rootId) : undefined);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // Prefer the rendered DOM id, which a `render` prop element or function may override.
    store.set('popupId', store.context.popupRef.current?.id || popupId);
    return () => {
      store.set('popupId', undefined);
    };
  }, [store, popupId]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete(true);
      }
    }
  });
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    transitionStatus,
    empty
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef],
    props: [popupProps, {
      id: popupId,
      role: inputInsidePopup ? 'dialog' : 'presentation',
      onFocus(event) {
        const target = (0, _utils.getTarget)(event.nativeEvent);
        if (openMethod !== 'touch' && ((0, _utils.contains)(store.state.listElement, target) || target === event.currentTarget)) {
          store.context.inputRef.current?.focus();
        }
      }
    }, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps],
    stateAttributesMapping
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const computedDefaultInitialFocus = inputInsidePopup ? interactionType => interactionType === 'touch' ? store.context.popupRef.current : inputElement : false;
  const resolvedInitialFocus = initialFocus === undefined ? computedDefaultInitialFocus : initialFocus;
  let resolvedFinalFocus;
  if (finalFocus != null) {
    resolvedFinalFocus = finalFocus;
  } else {
    resolvedFinalFocus = inputInsidePopup ? undefined : false;
  }
  const focusManagerModal = !inputInsidePopup || modal;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
    context: floatingRootContext,
    disabled: !mounted,
    modal: focusManagerModal,
    openInteractionType: openMethod,
    initialFocus: resolvedInitialFocus,
    returnFocus: resolvedFinalFocus,
    getInsideElements: () => [store.context.startDismissRef.current, store.context.endDismissRef.current],
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
      children: [element, focusManagerModal && /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxInternalDismissButton.ComboboxInternalDismissButton, {
        ref: store.context.endDismissRef
      })]
    })
  });
});
if (process.env.NODE_ENV !== "production") ComboboxPopup.displayName = "ComboboxPopup";