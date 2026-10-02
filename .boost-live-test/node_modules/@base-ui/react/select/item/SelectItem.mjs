'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useSelectRootContext, useSelectRootPropsContext } from "../root/SelectRootContext.mjs";
import { useCompositeListItem } from "../../internals/composite/list/useCompositeListItem.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { SelectItemContext } from "./SelectItemContext.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { compareItemEquality, removeItem, resolveSelectedIndex } from "../../internals/itemEquality.mjs";
import { isVirtualClick } from "../../floating-ui-react/utils/event.mjs";

/**
 * An individual option in the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const SelectItem = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef(function SelectItem(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    value: itemValue = null,
    label,
    disabled: disabledProp = false,
    nativeButton = false,
    ...elementProps
  } = componentProps;
  const textRef = React.useRef(null);
  const listItem = useCompositeListItem({
    guess: true,
    label,
    textRef
  });
  const store = useSelectRootContext();
  const {
    itemProps,
    multiple,
    disabled: selectDisabled,
    readOnly
  } = useSelectRootPropsContext();
  const disabled = selectDisabled || disabledProp;
  const highlighted = store.useState('isActive', listItem.index);
  const open = store.useState('open');
  const selected = store.useState('isSelected', itemValue);
  const selectedByFocus = store.useState('isSelectedByFocus', listItem.index);
  const isItemEqualToValue = store.useState('isItemEqualToValue');
  const index = listItem.index;
  const itemRef = React.useRef(null);
  useIsoLayoutEffect(() => {
    const values = store.context.valuesRef.current;
    values[index] = itemValue;
    return () => {
      delete values[index];
    };
  }, [index, itemValue, store]);
  useIsoLayoutEffect(() => {
    const selectedValue = store.state.value;
    const currentIndex = store.state.selectedIndex;
    let nextIndex = currentIndex;
    let claims;
    if (multiple && Array.isArray(selectedValue)) {
      // The claiming item also owns the text ref that aligns the popup.
      nextIndex = resolveSelectedIndex(index, itemValue, store.context.valuesRef.current, selectedValue, isItemEqualToValue, currentIndex);
      claims = nextIndex === index;
      if (index === currentIndex && !claims) {
        store.context.selectedItemTextRef.current = null;
      }
    } else {
      claims = selectedValue !== undefined && compareItemEquality(itemValue, selectedValue, isItemEqualToValue);
      if (claims) {
        nextIndex = index;
      }
    }
    store.set('selectedIndex', nextIndex);

    // Make sure SelectPopup can measure the selected item on first open.
    // SelectItemText can still update this ref later when focus moves.
    if (claims && textRef.current) {
      store.context.selectedItemTextRef.current = textRef.current;
    }
  }, [index, multiple, isItemEqualToValue, store, itemValue]);
  const pointerTypeRef = React.useRef('mouse');
  const allowMouseSelectionRef = React.useRef(false);
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
    composite: true
  });
  const state = {
    disabled,
    selected,
    highlighted
  };
  function commitSelection(event) {
    // A forced-open select (`open`/`defaultOpen`) can still receive item activations even
    // when the root is disabled or read-only, so guard the commit here too.
    if (selectDisabled || readOnly) {
      return;
    }
    const selectedValue = store.state.value;
    if (multiple) {
      const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
      const nextValue = selected ? removeItem(currentValue, itemValue, isItemEqualToValue) : [...currentValue, itemValue];
      store.context.setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));
    } else {
      store.context.setValue(itemValue, createChangeEventDetails(REASONS.itemPress, event));
      store.context.setOpen(false, createChangeEventDetails(REASONS.itemPress, event));
    }
  }
  function resetDragMovement() {
    store.context.selectionRef.current.dragY = 0;
  }
  const defaultProps = {
    role: 'option',
    'aria-selected': selected,
    tabIndex: open && highlighted ? 0 : -1,
    onKeyDown(event) {
      store.set('activeIndex', index);
      if (event.key === ' ' && store.context.typingRef.current) {
        // `useButton` skips Space activation for `role="option"` items when the keydown
        // is `defaultPrevented`, keeping typeahead spaces from committing a selection.
        event.preventDefault();
      }
    },
    onClick(event) {
      const isMouseClick = pointerTypeRef.current !== 'touch';
      const clickPointerType = event.nativeEvent.pointerType;
      const isVirtualMouseClick = isMouseClick && isVirtualClick(event.nativeEvent) && (
      // Generic no-pointer `detail === 0` clicks stay tied to highlight state. Virtual
      // clicks that carry browser pointer data, including an empty string from assistive
      // technology, can activate unhighlighted items.
      clickPointerType !== undefined || highlighted);
      // With alignItemWithTrigger, opening can place an item under the cursor. Real mouse
      // clicks must start on the item, while virtual clicks represent explicit keyboard or
      // assistive technology activation.
      const isInvalidMouseClick = isMouseClick && !isVirtualMouseClick && !allowMouseSelectionRef.current;
      allowMouseSelectionRef.current = false;
      if (disabled || isInvalidMouseClick) {
        return;
      }
      commitSelection(event.nativeEvent);
    },
    onPointerEnter(event) {
      pointerTypeRef.current = event.pointerType;
    },
    onPointerMove(event) {
      if (event.pointerType === 'mouse' && event.buttons === 1) {
        const selection = store.context.selectionRef.current;
        selection.dragY += event.movementY;
        if (selection.dragY ** 2 >= 64) {
          selection.allowUnselectedMouseUp = true;
        }
      }
    },
    onPointerDown(event) {
      pointerTypeRef.current = event.pointerType;
      allowMouseSelectionRef.current = true;
      resetDragMovement();
    },
    onMouseUp() {
      resetDragMovement();
      if (disabled || pointerTypeRef.current === 'touch') {
        return;
      }

      // Regular clicks are committed by the click event.
      if (allowMouseSelectionRef.current) {
        return;
      }
      const disallowSelectedMouseUp = !store.context.selectionRef.current.allowSelectedMouseUp && selected;
      const disallowUnselectedMouseUp = !store.context.selectionRef.current.allowUnselectedMouseUp && !selected;
      if (disallowSelectedMouseUp || disallowUnselectedMouseUp) {
        return;
      }
      allowMouseSelectionRef.current = true;
      itemRef.current?.click();
      allowMouseSelectionRef.current = false;
    }
  };
  const element = useRenderElement('div', componentProps, {
    ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
    state,
    props: [itemProps, defaultProps, elementProps, getButtonProps]
  });
  const contextValue = React.useMemo(() => ({
    selected,
    index,
    textRef,
    selectedByFocus
  }), [selected, index, textRef, selectedByFocus]);
  return /*#__PURE__*/_jsx(SelectItemContext.Provider, {
    value: contextValue,
    children: element
  });
}));
if (process.env.NODE_ENV !== "production") SelectItem.displayName = "SelectItem";