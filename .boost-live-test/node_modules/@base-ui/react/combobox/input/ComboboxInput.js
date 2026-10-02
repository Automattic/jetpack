"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxInput = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _platform = require("@base-ui/utils/platform");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _constants = require("../../internals/field-constants/constants");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _ComboboxChipsContext = require("../chips/ComboboxChipsContext");
var _utils = require("../../floating-ui-react/utils");
var _ComboboxPositionerContext = require("../positioner/ComboboxPositionerContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _ComboboxInternalDismissButton = require("../utils/ComboboxInternalDismissButton");
var _parts = require("../utils/parts");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxInput = exports.ComboboxInput = /*#__PURE__*/React.forwardRef(function ComboboxInput(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState,
    disabled: fieldDisabled,
    setTouched,
    setFocused,
    validationMode,
    validation
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId: fieldLabelId
  } = (0, _LabelableContext.useLabelableContext)();
  const comboboxChipsContext = (0, _ComboboxChipsContext.useComboboxChipsContext)();
  const positioning = (0, _ComboboxPositionerContext.useComboboxPositionerContext)(true);
  const hasPositionerParent = Boolean(positioning);
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  // `inputValue` can't be placed in the store.
  // https://github.com/mui/base-ui/issues/2703
  const inputValue = (0, _ComboboxRootContext.useComboboxInputValueContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const required = store.useState('required');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const name = store.useState('name');
  const form = store.useState('form');
  const selectionMode = store.useState('selectionMode');
  const autoHighlightMode = store.useState('autoHighlight');
  const inputProps = store.useState('inputProps');
  const triggerProps = store.useState('triggerProps');
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const selectedValue = store.useState('selectedValue');
  const rootId = store.useState('id');
  const inline = store.useState('inline');
  const modal = store.useState('modal');
  const autoHighlightEnabled = Boolean(autoHighlightMode);
  const popupSide = (0, _parts.usePopupSide)(store);
  const disabled = fieldDisabled || comboboxDisabled || disabledProp;
  const listEmpty = (0, _parts.useListEmpty)();
  const isInsidePopup = hasPositionerParent || inline;
  const focusManagerModal = !isInsidePopup || modal;
  const id = (0, _useBaseUiId.useBaseUiId)(idProp ?? (!isInsidePopup ? rootId : undefined));
  const fieldStateForInput = hasPositionerParent ? _constants.DEFAULT_FIELD_STATE_ATTRIBUTES : fieldState;
  const [composingValue, setComposingValue] = React.useState(null);
  const isComposingRef = React.useRef(false);
  const lastActiveIndexRef = React.useRef(null);
  const shouldRestoreActiveIndexRef = React.useRef(false);
  const inputOwnsFormValue = selectionMode === 'none' && !hasPositionerParent;
  const setInputElement = (0, _useStableCallback.useStableCallback)(element => {
    const nextIsInsidePopup = hasPositionerParent || store.state.inline;
    if (nextIsInsidePopup && !store.state.hasInputValue) {
      store.context.setInputValue('', (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none));
    }
    store.update({
      inputElement: element,
      inputInsidePopup: nextIsInsidePopup,
      inputOwnsFormValue
    });
  });
  const validationProps = hasPositionerParent ? elementProps : validation.getValidationProps(disabled, elementProps);
  function clearHighlight() {
    store.context.setIndices({
      activeIndex: null,
      selectedIndex: null,
      type: store.context.keyboardActiveRef.current ? _reasons.REASONS.keyboard : _reasons.REASONS.pointer
    });
  }
  function markPointerActive() {
    store.context.keyboardActiveRef.current = false;
  }
  const state = {
    ...fieldStateForInput,
    open,
    disabled,
    readOnly,
    popupSide,
    listEmpty
  };
  function handleKeyDown(event) {
    if (!comboboxChipsContext) {
      return undefined;
    }
    let nextIndex;
    const {
      highlightedChipIndex
    } = comboboxChipsContext;
    const renderedChipsCount = comboboxChipsContext.chipsRef.current.length;
    const [previousChipKey, nextChipKey] = (0, _parts.getChipNavigationKeys)(direction);
    if (highlightedChipIndex !== undefined) {
      if (event.key === previousChipKey) {
        event.preventDefault();
        if (highlightedChipIndex > 0) {
          nextIndex = highlightedChipIndex - 1;
        } else {
          nextIndex = undefined;
        }
      } else if (event.key === nextChipKey) {
        event.preventDefault();
        if (highlightedChipIndex < renderedChipsCount - 1) {
          nextIndex = highlightedChipIndex + 1;
        } else {
          nextIndex = undefined;
        }
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        // Move highlight appropriately after removal.
        nextIndex = (0, _parts.getIndexAfterChipRemoval)(highlightedChipIndex, selectedValue.length);
        clearHighlight();
      }
      return nextIndex;
    }

    // Handle navigation when no chip is highlighted
    if (event.key === previousChipKey && (event.currentTarget.selectionStart ?? 0) === 0 && selectedValue.length > 0) {
      event.preventDefault();
      nextIndex = renderedChipsCount > 0 ? renderedChipsCount - 1 : undefined;
    }
    return nextIndex;
  }
  const element = (0, _useRenderElement.useRenderElement)('input', componentProps, {
    state,
    ref: [forwardedRef, store.context.inputRef, setInputElement],
    props: [inputProps, triggerProps, {
      value: composingValue ?? inputValue,
      'aria-readonly': readOnly || undefined,
      'aria-required': required || undefined,
      'aria-labelledby': fieldLabelId,
      disabled,
      readOnly,
      required: selectionMode === 'none' ? required : undefined,
      form,
      ...(inputOwnsFormValue && name && {
        name
      }),
      id,
      onFocus() {
        setFocused(true);
        if (!inline || !shouldRestoreActiveIndexRef.current) {
          return;
        }
        shouldRestoreActiveIndexRef.current = false;
        const nextActiveIndex = lastActiveIndexRef.current;
        if (nextActiveIndex == null ||
        // `valuesRef` can be sparse, so guard against restoring a removed slot.
        !Object.hasOwn(store.context.valuesRef.current, nextActiveIndex)) {
          return;
        }
        store.context.setIndices({
          activeIndex: nextActiveIndex
        });
      },
      onBlur() {
        setTouched(true);
        setFocused(false);
        const activeIndex = store.state.activeIndex;
        if (inline && activeIndex !== null && autoHighlightMode !== 'always') {
          lastActiveIndexRef.current = activeIndex;
          shouldRestoreActiveIndexRef.current = true;
          store.context.setIndices({
            activeIndex: null
          });
        }
        if (validationMode === 'onBlur') {
          const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
          validation.commit(valueToValidate);
        }
      },
      onCompositionStart(event) {
        if (_platform.platform.os.android) {
          return;
        }
        isComposingRef.current = true;
        setComposingValue(event.currentTarget.value);
      },
      onCompositionEnd(event) {
        isComposingRef.current = false;
        const next = event.currentTarget.value;
        setComposingValue(null);
        store.context.setInputValue(next, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputChange, event.nativeEvent));
      },
      onChange(event) {
        const nativeEvent = event.nativeEvent;
        // Autofill may not provide `inputType` (Chrome) or may report
        // `insertReplacementText` (Firefox).
        const inputType = nativeEvent.inputType;
        const autofillLikeInput = !inputType || inputType === 'insertReplacementText';
        // During composition the input is always considered typed into.
        const shouldOpenOnInput = isComposingRef.current || !autofillLikeInput;
        function maybeOpenOnInput(trimmed) {
          if (readOnly || disabled || !trimmed || !shouldOpenOnInput) {
            return;
          }
          store.context.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputChange, nativeEvent));
          // When autoHighlight is enabled, keep the highlight (will be set to 0 in root).
          if (!autoHighlightEnabled) {
            clearHighlight();
          }
        }

        // During IME composition, avoid propagating controlled updates to prevent
        // filtering the options prematurely so `Empty` won't show incorrectly.
        // We can't rely on this check for Android due to how it handles composition
        // events with some keyboards (e.g. Samsung keyboard with predictive text on
        // treats all text as always-composing).
        // https://github.com/mui/base-ui/issues/2942
        if (isComposingRef.current) {
          const nextVal = event.currentTarget.value;
          setComposingValue(nextVal);
          if (nextVal === '' && !store.state.openOnInputClick && !store.state.inputInsidePopup) {
            store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputClear, nativeEvent));
          }
          const trimmed = nextVal.trim();
          const shouldMaintainHighlight = autoHighlightEnabled && trimmed !== '';
          maybeOpenOnInput(trimmed);
          if (open && store.state.activeIndex !== null && !shouldMaintainHighlight) {
            clearHighlight();
          }
          return;
        }
        const inputChangeDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputChange, nativeEvent);
        store.context.setInputValue(event.currentTarget.value, inputChangeDetails);
        if (inputChangeDetails.isCanceled) {
          return;
        }
        const empty = event.currentTarget.value === '';
        const clearDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputClear, nativeEvent);
        if (empty && !store.state.inputInsidePopup) {
          if (selectionMode === 'single') {
            store.context.setSelectedValue(null, clearDetails);
          }
          if (!store.state.openOnInputClick) {
            store.context.setOpen(false, clearDetails);
          }
        }
        maybeOpenOnInput(event.currentTarget.value.trim());

        // When the user types, ensure the list resets its highlight so that
        // virtual focus returns to the input (aria-activedescendant is
        // cleared).
        if (open && store.state.activeIndex !== null && !autoHighlightEnabled) {
          clearHighlight();
        }
      },
      onKeyDown(event) {
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
          return;
        }

        // Tracked before the guards so `readOnly` browsing reports keyboard highlight reasons.
        store.context.keyboardActiveRef.current = true;
        if (disabled || readOnly) {
          // Browsing can highlight an item, and Enter there must not submit the form.
          if (readOnly && event.key === 'Enter' && open && store.state.activeIndex !== null) {
            (0, _utils.stopEvent)(event);
          }
          return;
        }
        const input = event.currentTarget;
        const scrollAmount = input.scrollWidth - input.clientWidth;
        const isRTL = direction === 'rtl';
        if (event.key === 'Home') {
          (0, _utils.stopEvent)(event);
          const cursor = _platform.platform.engine.gecko && isRTL ? input.value.length : 0;
          input.setSelectionRange(cursor, cursor);
          input.scrollLeft = 0;
          return;
        }
        if (event.key === 'End') {
          (0, _utils.stopEvent)(event);
          const cursor = _platform.platform.engine.gecko && isRTL ? 0 : input.value.length;
          input.setSelectionRange(cursor, cursor);
          input.scrollLeft = isRTL ? -scrollAmount : scrollAmount;
          return;
        }
        if (!mounted && event.key === 'Escape') {
          const isClear = selectionMode === 'multiple' && Array.isArray(selectedValue) ? selectedValue.length === 0 : selectedValue === null;
          const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.escapeKey, event.nativeEvent);
          const value = selectionMode === 'multiple' ? [] : null;
          store.context.setInputValue('', details);
          store.context.setSelectedValue(value, details);
          if (!isClear && !store.state.inline && !details.isPropagationAllowed) {
            event.stopPropagation();
          }
          return;
        }

        // Handle deletion when no chip is highlighted and the input is empty.
        if (comboboxChipsContext && event.key === 'Backspace' && input.value === '' && comboboxChipsContext.highlightedChipIndex === undefined && Array.isArray(selectedValue) && selectedValue.length > 0) {
          const renderedChipsCount = comboboxChipsContext.chipsRef.current.length;
          const removalIndex = renderedChipsCount > 0 ? renderedChipsCount - 1 : selectedValue.length - 1;
          const newValue = selectedValue.filter((_, index) => index !== removalIndex);
          // If the removed item was also the active (highlighted) item, clear highlight
          clearHighlight();
          store.context.setSelectedValue(newValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent));
          return;
        }
        const hadHighlightedChip = comboboxChipsContext?.highlightedChipIndex !== undefined;
        const nextIndex = handleKeyDown(event);
        comboboxChipsContext?.setHighlightedChipIndex(nextIndex);
        if (nextIndex !== undefined) {
          comboboxChipsContext?.chipsRef.current[nextIndex]?.focus();
        } else if (hadHighlightedChip) {
          store.context.inputRef.current?.focus();
        }

        // event.isComposing
        if (event.which === 229) {
          return;
        }
        if (event.key === 'Enter' && open) {
          const activeIndex = store.state.activeIndex;
          const nativeEvent = event.nativeEvent;
          if (activeIndex === null) {
            if (inline) {
              return;
            }

            // Allow form submission when no item is highlighted.
            store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, nativeEvent));
            return;
          }
          (0, _utils.stopEvent)(event);
          (0, _parts.clickHighlightedItem)(store, activeIndex, nativeEvent);
        }
      },
      onPointerMove: markPointerActive,
      onPointerDown: markPointerActive
    }, validationProps],
    stateAttributesMapping: _stateAttributesMapping.triggerStateAttributesMapping
  });
  const renderedInput = hasPositionerParent ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_FieldRootContext.FieldRootContext.Provider, {
    value: _FieldRootContext.DEFAULT_FIELD_ROOT_CONTEXT,
    children: element
  }) : element;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [open && focusManagerModal && /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxInternalDismissButton.ComboboxInternalDismissButton, {
      ref: store.context.startDismissRef
    }), renderedInput]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxInput.displayName = "ComboboxInput";