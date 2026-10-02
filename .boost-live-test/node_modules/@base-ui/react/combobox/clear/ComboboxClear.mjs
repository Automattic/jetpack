'use client';

import * as React from 'react';
import { useComboboxInputValueContext, useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
const stateAttributesMapping = {
  ...transitionStatusMapping,
  ...triggerOpenStateMapping
};

/**
 * Clears the value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxClear = /*#__PURE__*/React.forwardRef(function ComboboxClear(componentProps, forwardedRef) {
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
  } = useFieldRootContext();
  const store = useComboboxRootContext();
  const selectionMode = store.useState('selectionMode');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const open = store.useState('open');
  const selectedValue = store.useState('selectedValue');
  const hasSelectionChips = store.useState('hasSelectionChips');
  const inputValue = useComboboxInputValueContext();
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
  } = useButton({
    native: nativeButton,
    disabled
  });
  const {
    mounted,
    transitionStatus,
    setMounted
  } = useTransitionStatus(visible);
  const state = {
    disabled,
    visible,
    open,
    transitionStatus
  };
  useOpenChangeComplete({
    open: visible,
    ref: store.context.clearRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    }
  });
  const element = useRenderElement('button', componentProps, {
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
        const type = store.context.keyboardActiveRef.current ? REASONS.keyboard : REASONS.pointer;
        store.context.setInputValue('', createChangeEventDetails(REASONS.clearPress, event.nativeEvent));
        if (selectionMode !== 'none') {
          store.context.setSelectedValue(Array.isArray(selectedValue) ? [] : null, createChangeEventDetails(REASONS.clearPress, event.nativeEvent));
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