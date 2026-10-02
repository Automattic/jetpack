"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxChip = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxChipsContext = require("../chips/ComboboxChipsContext");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _useCompositeListItem = require("../../internals/composite/list/useCompositeListItem");
var _ComboboxChipContext = require("./ComboboxChipContext");
var _utils = require("../../floating-ui-react/utils");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _parts = require("../utils/parts");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * An individual chip that represents a value in a multiselectable input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxChip = exports.ComboboxChip = /*#__PURE__*/React.forwardRef(function ComboboxChip(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const {
    setHighlightedChipIndex,
    chipsRef
  } = (0, _ComboboxChipsContext.useComboboxChipsContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const disabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const selectedValue = store.useState('selectedValue');
  const {
    ref,
    index
  } = (0, _useCompositeListItem.useCompositeListItem)();
  function handleKeyDown(event) {
    let nextIndex = index;
    const [previousChipKey, nextChipKey] = (0, _parts.getChipNavigationKeys)(direction);
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
      nextIndex = (0, _parts.getIndexAfterChipRemoval)(index, selectedValue.length);
      (0, _utils.stopEvent)(event);
      store.context.setIndices({
        activeIndex: null,
        selectedIndex: null,
        type: _reasons.REASONS.keyboard
      });
      store.context.setSelectedValue(selectedValue.filter((_, i) => i !== index), (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent));
    } else if (event.key === 'Enter' || event.key === ' ') {
      (0, _utils.stopEvent)(event);
      nextIndex = undefined;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      (0, _utils.stopEvent)(event);
      store.context.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.listNavigation, event.nativeEvent));
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
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
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
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxChipContext.ComboboxChipContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ComboboxChip.displayName = "ComboboxChip";