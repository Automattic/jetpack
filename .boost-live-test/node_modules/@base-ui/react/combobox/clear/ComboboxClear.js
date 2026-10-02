"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxClear = void 0;
var React = _interopRequireWildcard(require("react"));
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useButton = require("../../internals/use-button");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _popupStateMapping = require("../../utils/popupStateMapping");
const stateAttributesMapping = {
  ..._stateAttributesMapping.transitionStatusMapping,
  ..._popupStateMapping.triggerOpenStateMapping
};

/**
 * Clears the value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxClear = exports.ComboboxClear = /*#__PURE__*/React.forwardRef(function ComboboxClear(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    keepMounted = false,
    style,
    ...elementProps
  } = componentProps;
  const {
    disabled: fieldDisabled
  } = (0, _FieldRootContext.useFieldRootContext)();
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const selectionMode = store.useState('selectionMode');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const open = store.useState('open');
  const selectedValue = store.useState('selectedValue');
  const hasSelectionChips = store.useState('hasSelectionChips');
  const inputValue = (0, _ComboboxRootContext.useComboboxInputValueContext)();
  let visible = false;
  if (selectionMode === 'none') {
    visible = inputValue !== '';
  } else if (selectionMode === 'single') {
    visible = selectedValue != null;
  } else {
    visible = hasSelectionChips;
  }
  const disabled = fieldDisabled || comboboxDisabled || disabledProp;
  const {
    buttonRef,
    getButtonProps
  } = (0, _useButton.useButton)({
    native: nativeButton,
    disabled
  });
  const {
    mounted,
    transitionStatus,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(visible);
  const state = {
    disabled,
    visible,
    open,
    transitionStatus
  };
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open: visible,
    ref: store.context.clearRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    }
  });
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, store.context.clearRef],
    props: [{
      tabIndex: -1,
      children: 'x',
      // Avoid stealing focus from the input.
      onMouseDown(event) {
        event.preventDefault();
      },
      onClick(event) {
        if (disabled || readOnly) {
          return;
        }
        const type = store.context.keyboardActiveRef.current ? _reasons.REASONS.keyboard : _reasons.REASONS.pointer;
        store.context.setInputValue('', (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.clearPress, event.nativeEvent));
        if (selectionMode !== 'none') {
          store.context.setSelectedValue(Array.isArray(selectedValue) ? [] : null, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.clearPress, event.nativeEvent));
          // A distinct object shape: `Store.update` iterates own keys, so passing an explicit
          // `selectedIndex: undefined` would overwrite the state instead of leaving it alone.
          store.context.setIndices({
            activeIndex: null,
            selectedIndex: null,
            type
          });
        } else {
          store.context.setIndices({
            activeIndex: null,
            type
          });
        }
        store.context.inputRef.current?.focus();
      }
    }, elementProps, getButtonProps],
    stateAttributesMapping
  });
  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") ComboboxClear.displayName = "ComboboxClear";