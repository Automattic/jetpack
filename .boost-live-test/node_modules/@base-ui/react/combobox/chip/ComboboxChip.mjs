'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useComboboxChipsContext } from "../chips/ComboboxChipsContext.mjs";
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { useCompositeListItem } from "../../internals/composite/list/useCompositeListItem.mjs";
import { ComboboxChipContext } from "./ComboboxChipContext.mjs";
import { stopEvent } from "../../floating-ui-react/utils.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useDirection } from "../../internals/direction-context/DirectionContext.mjs";
import { getChipNavigationKeys, getIndexAfterChipRemoval } from "../utils/parts.mjs";

/**
 * An individual chip that represents a value in a multiselectable input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ComboboxChip = /*#__PURE__*/React.forwardRef(function ComboboxChip(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = useComboboxRootContext();
  const {
    setHighlightedChipIndex,
    chipsRef
  } = useComboboxChipsContext();
  const direction = useDirection();
  const disabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const selectedValue = store.useState('selectedValue');
  const {
    ref,
    index
  } = useCompositeListItem();
  function handleKeyDown(event) {
    let nextIndex = index;
    const [previousChipKey, nextChipKey] = getChipNavigationKeys(direction);
    if (event.key === previousChipKey) {
      event.preventDefault();
      if (index > 0) {
        nextIndex = index - 1;
      } else {
        nextIndex = undefined;
      }
    } else if (event.key === nextChipKey) {
      event.preventDefault();
      if (index < chipsRef.current.length - 1) {
        nextIndex = index + 1;
      } else {
        nextIndex = undefined;
      }
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      nextIndex = getIndexAfterChipRemoval(index, selectedValue.length);
      stopEvent(event);
      store.context.setIndices({
        activeIndex: null,
        selectedIndex: null,
        type: REASONS.keyboard
      });
      store.context.setSelectedValue(selectedValue.filter((_, i) => i !== index), createChangeEventDetails(REASONS.none, event.nativeEvent));
    } else if (event.key === 'Enter' || event.key === ' ') {
      stopEvent(event);
      nextIndex = undefined;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      stopEvent(event);
      store.context.setOpen(true, createChangeEventDetails(REASONS.listNavigation, event.nativeEvent));
      nextIndex = undefined;
    } else if (
    // Check for printable characters (letters, numbers, symbols)
    event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      nextIndex = undefined;
    }
    return nextIndex;
  }
  const state = {
    disabled
  };
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, ref],
    state,
    props: [{
      tabIndex: -1,
      'aria-disabled': disabled || undefined,
      'aria-readonly': readOnly || undefined,
      onKeyDown(event) {
        if (disabled || readOnly) {
          return;
        }
        const nextIndex = handleKeyDown(event);
        ReactDOM.flushSync(() => {
          setHighlightedChipIndex(nextIndex);
        });
        if (nextIndex === undefined) {
          store.context.inputRef.current?.focus();
        } else {
          chipsRef.current[nextIndex]?.focus();
        }
      }
    }, elementProps]
  });
  const contextValue = React.useMemo(() => ({
    index
  }), [index]);
  return /*#__PURE__*/_jsx(ComboboxChipContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ComboboxChip.displayName = "ComboboxChip";