"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectItem = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _SelectRootContext = require("../root/SelectRootContext");
var _useCompositeListItem = require("../../internals/composite/list/useCompositeListItem");
var _useRenderElement = require("../../internals/useRenderElement");
var _SelectItemContext = require("./SelectItemContext");
var _useButton = require("../../internals/use-button");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _itemEquality = require("../../internals/itemEquality");
var _event = require("../../floating-ui-react/utils/event");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * An individual option in the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectItem = exports.SelectItem = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef(function SelectItem(componentProps, forwardedRef) {
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
  const listItem = (0, _useCompositeListItem.useCompositeListItem)({
    guess: true,
    label,
    textRef
  });
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const {
    itemProps,
    multiple,
    disabled: selectDisabled,
    readOnly
  } = (0, _SelectRootContext.useSelectRootPropsContext)();
  const disabled = selectDisabled || disabledProp;
  const highlighted = store.useState('isActive', listItem.index);
  const open = store.useState('open');
  const selected = store.useState('isSelected', itemValue);
  const selectedByFocus = store.useState('isSelectedByFocus', listItem.index);
  const isItemEqualToValue = store.useState('isItemEqualToValue');
  const index = listItem.index;
  const itemRef = React.useRef(null);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const values = store.context.valuesRef.current;
    values[index] = itemValue;
    return () => {
      delete values[index];
    };
  }, [index, itemValue, store]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const selectedValue = store.state.value;
    const currentIndex = store.state.selectedIndex;
    let nextIndex = currentIndex;
    let claims;
    if (multiple && Array.isArray(selectedValue)) {
      // The claiming item also owns the text ref that aligns the popup.
      nextIndex = (0, _itemEquality.resolveSelectedIndex)(index, itemValue, store.context.valuesRef.current, selectedValue, isItemEqualToValue, currentIndex);
      claims = nextIndex === index;
      if (index === currentIndex && !claims) {
        store.context.selectedItemTextRef.current = null;
      }
    } else {
      claims = selectedValue !== undefined && (0, _itemEquality.compareItemEquality)(itemValue, selectedValue, isItemEqualToValue);
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
  } = (0, _useButton.useButton)({
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
      const nextValue = selected ? (0, _itemEquality.removeItem)(currentValue, itemValue, isItemEqualToValue) : [...currentValue, itemValue];
      store.context.setValue(nextValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.itemPress, event));
    } else {
      store.context.setValue(itemValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.itemPress, event));
      store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.itemPress, event));
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
      const isVirtualMouseClick = isMouseClick && (0, _event.isVirtualClick)(event.nativeEvent) && (
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
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
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
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_SelectItemContext.SelectItemContext.Provider, {
    value: contextValue,
    children: element
  });
}));
if (process.env.NODE_ENV !== "production") SelectItem.displayName = "SelectItem";