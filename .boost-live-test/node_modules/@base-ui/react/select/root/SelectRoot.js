"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectRoot = SelectRoot;
var React = _interopRequireWildcard(require("react"));
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _useOnFirstRender = require("@base-ui/utils/useOnFirstRender");
var _usePreviousValue = require("@base-ui/utils/usePreviousValue");
var _isElementDisabled = require("@base-ui/utils/isElementDisabled");
var _useControlled = require("@base-ui/utils/useControlled");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _store = require("@base-ui/utils/store");
var _empty = require("@base-ui/utils/empty");
var _floatingUiReact = require("../../floating-ui-react");
var _SelectRootContext = require("./SelectRootContext");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../../internals/field-register-control/useRegisterFieldControl");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _store2 = require("../store");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _FormContext = require("../../internals/form-context/FormContext");
var _resolveValueLabel = require("../../internals/resolveValueLabel");
var _itemEquality = require("../../internals/itemEquality");
var _useValueChanged = require("../../internals/useValueChanged");
var _useOpenInteractionType = require("../../utils/useOpenInteractionType");
var _scrollEdges = require("../../utils/scrollEdges");
var _popups = require("../../utils/popups");
var _mergeProps = require("../../merge-props");
var _noop = require("../../internals/noop");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
function SelectRoot(props) {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name: nameProp,
    form,
    autoComplete,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple = false,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue = _itemEquality.defaultItemEquality,
    highlightItemOnHover = true,
    children
  } = props;
  const {
    clearErrors
  } = (0, _FormContext.useFormContext)();
  const {
    setDirty,
    setTouched,
    setFocused,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
    validationMode
  } = (0, _FieldRootContext.useFieldRootContext)();
  const generatedId = (0, _useLabelableId.useLabelableId)({
    id
  });
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const [value, setValueUnwrapped] = (0, _useControlled.useControlled)({
    controlled: valueProp,
    default: multiple ? defaultValue ?? _empty.EMPTY_ARRAY : defaultValue,
    name: 'Select',
    state: 'value'
  });
  const [open, setOpenUnwrapped] = (0, _useControlled.useControlled)({
    controlled: openProp,
    default: defaultOpen,
    name: 'Select',
    state: 'open'
  });
  const listRef = React.useRef([]);
  const labelsRef = React.useRef([]);
  const popupRef = React.useRef(null);
  const scrollHandlerRef = React.useRef(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef(null);
  const valuesRef = React.useRef([]);
  const typingRef = React.useRef(false);
  const firstItemTextRef = React.useRef(null);
  const selectedItemTextRef = React.useRef(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    dragY: 0
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);
  const initialValueRef = React.useRef(value);
  const {
    mounted,
    setMounted,
    transitionStatus
  } = (0, _useTransitionStatus.useTransitionStatus)(open);
  const {
    openMethod,
    triggerProps: interactionTypeProps
  } = (0, _useOpenInteractionType.useOpenInteractionType)(open);
  const store = (0, _useRefWithInit.useRefWithInit)(() => new _store.ReactStore({
    id: generatedId,
    labelId: undefined,
    modal,
    multiple,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    value,
    open,
    mounted,
    transitionStatus,
    items,
    forceMount: false,
    openMethod: null,
    activeIndex: null,
    selectedIndex: null,
    popupProps: _empty.EMPTY_OBJECT,
    triggerProps: _empty.EMPTY_OBJECT,
    triggerElement: null,
    positionerElement: null,
    listElement: null,
    popupSide: null,
    scrollUpArrowVisible: false,
    scrollDownArrowVisible: false,
    hasScrollArrows: false
  }, {
    setValue: _noop.NOOP,
    setOpen: _noop.NOOP,
    handleScrollArrowVisibility: _noop.NOOP,
    onOpenChangeComplete: _noop.NOOP,
    listRef,
    popupRef,
    scrollHandlerRef,
    scrollArrowsMountedCountRef,
    valueRef,
    valuesRef,
    labelsRef,
    typingRef,
    selectionRef,
    firstItemTextRef,
    selectedItemTextRef,
    alignItemWithTriggerActiveRef,
    initialValueRef
  }, _store2.selectors)).current;
  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const triggerElement = store.useState('triggerElement');
  const positionerElement = store.useState('positionerElement');
  const previousOpenMethod = (0, _usePreviousValue.usePreviousValue)(openMethod);
  const renderedOpenMethod = openMethod ?? previousOpenMethod;
  const serializedValue = React.useMemo(() => {
    // In multiple mode the shared input is nameless; per-value entries are submitted via
    // `hiddenInputs`. Its value is therefore irrelevant, and passing the whole array to
    // `stringifyAsValue` would invoke a user `itemToStringValue` with an array it doesn't expect.
    if (multiple) {
      return '';
    }
    return (0, _resolveValueLabel.stringifyAsValue)(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);
  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map(currentValue => (0, _resolveValueLabel.stringifyAsValue)(currentValue, itemToStringValue));
    }
    return (0, _resolveValueLabel.stringifyAsValue)(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);
  const controlRef = (0, _useValueAsRef.useValueAsRef)(triggerElement);
  const getStringifiedValueForForm = (0, _useStableCallback.useStableCallback)(() => fieldStringValue);
  (0, _useRegisterFieldControl.useRegisterFieldControl)(controlRef, generatedId, value, getStringifiedValueForForm, !disabled, nameProp);

  // Mirror the `hasSelectedValue` store selector so the Field's filled state agrees with the
  // trigger/value placeholder semantics (a value serializing to `''` counts as empty).
  const hasSelectedValue = multiple ? Array.isArray(value) && value.length > 0 : value != null && serializedValue !== '';
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(function syncSelectedIndex() {
    const nextIndex = (0, _itemEquality.findSelectionIndex)(valuesRef.current, value, isItemEqualToValue, multiple);
    if (nextIndex === null) {
      selectedItemTextRef.current = null;
    }
    if (open) {
      return;
    }
    store.set('selectedIndex', nextIndex);
  }, [multiple, open, value, isItemEqualToValue, store]);
  (0, _useValueChanged.useValueChanged)(value, () => {
    clearErrors(name);
    setDirty((0, _itemEquality.isSelectedValueDirty)(value, validityData.initialValue, isItemEqualToValue));
    validation.change(value);
  });
  const setOpen = (0, _useStableCallback.useStableCallback)((nextOpen, eventDetails) => {
    onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setOpenUnwrapped(nextOpen);
    if (!nextOpen && (eventDetails.reason === _reasons.REASONS.focusOut || eventDetails.reason === _reasons.REASONS.outsidePress)) {
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit(value);
      }
    }
  });
  const handleUnmount = (0, _useStableCallback.useStableCallback)(() => {
    setMounted(false);
    store.update({
      activeIndex: null,
      openMethod: null,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false
    });
    onOpenChangeComplete?.(false);
  });
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    }
  });
  React.useImperativeHandle(actionsRef, () => ({
    unmount: handleUnmount
  }), [handleUnmount]);
  const setValue = (0, _useStableCallback.useStableCallback)((nextValue, eventDetails) => {
    onValueChange?.(nextValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueUnwrapped(nextValue);
  });
  const handleScrollArrowVisibility = (0, _useStableCallback.useStableCallback)(scroller => {
    const maxScrollTop = (0, _scrollEdges.getMaxScrollOffset)(scroller.scrollHeight, scroller.clientHeight);
    const scrollTop = (0, _scrollEdges.normalizeScrollOffset)(scroller.scrollTop, maxScrollTop);
    const shouldShowUp = scrollTop > 0;
    const shouldShowDown = scrollTop < maxScrollTop;
    store.set('scrollUpArrowVisible', shouldShowUp);
    store.set('scrollDownArrowVisible', shouldShowDown);
  });
  const floatingContext = (0, _floatingUiReact.useFloatingRootContext)({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement
    }
  });

  // `readOnly` locks the value, not the interaction: the popup can be opened and browsed so the
  // user can see the available options and which one is selected. Committing a value is blocked
  // separately in `SelectItem` and in the hidden input's autofill handler.
  const click = (0, _floatingUiReact.useClick)(floatingContext, {
    enabled: !disabled,
    event: 'mousedown'
  });
  const dismiss = (0, _floatingUiReact.useDismiss)(floatingContext);
  const listNavigation = (0, _floatingUiReact.useListNavigation)(floatingContext, {
    enabled: !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: _empty.EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }
      store.set('activeIndex', nextActiveIndex);
    },
    focusItemOnHover: highlightItemOnHover
  });
  const typeahead = (0, _floatingUiReact.useTypeahead)(floatingContext, {
    // Typeahead on an open popup only moves the highlight, so it remains available while
    // `readOnly`. The closed-trigger variant commits a value instead, so it doesn't.
    enabled: !disabled && (open || !readOnly && !multiple),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    // Skip disabled items while matching so typeahead advances to the next selectable item
    // (a click can never select a disabled item and native `<select>` skips them too). Resolve
    // the disabled state from the element via the attribute-only `isElementDisabled` so the
    // hidden, force-mounted items used for closed-trigger typeahead aren't dropped by the
    // `elementsRef`/visibility filter that `disabledIndices` deliberately sidesteps.
    disabledIndices: index => (0, _isElementDisabled.isElementDisabled)(listRef.current[index]),
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none));
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    }
  });

  // `Select.Trigger` applies the id itself from the store, so it's deliberately not merged here.
  const mergedTriggerProps = React.useMemo(() => (0, _mergeProps.mergeProps)(typeahead.reference, listNavigation.reference, dismiss.reference, click.reference, interactionTypeProps), [click.reference, typeahead.reference, listNavigation.reference, dismiss.reference, interactionTypeProps]);
  const popupProps = React.useMemo(() => (0, _mergeProps.mergeProps)(_popups.FOCUSABLE_POPUP_PROPS, typeahead.floating, listNavigation.floating, dismiss.floating), [typeahead.floating, listNavigation.floating, dismiss.floating]);
  const itemProps = listNavigation.item ?? _empty.EMPTY_OBJECT;
  store.useContextCallback('setValue', setValue);
  store.useContextCallback('setOpen', setOpen);
  store.useContextCallback('handleScrollArrowVisibility', handleScrollArrowVisibility);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  // The prop bags must be in the store before the parts render. `useSyncedValues` writes in a
  // layout effect, after all descendants have rendered.
  (0, _useOnFirstRender.useOnFirstRender)(() => {
    store.update({
      popupProps,
      triggerProps: mergedTriggerProps
    });
  });
  store.useSyncedValues({
    id: generatedId,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    popupProps,
    triggerProps: mergedTriggerProps,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    openMethod: renderedOpenMethod
  });
  const rootPropsContextValue = React.useMemo(() => ({
    disabled,
    readOnly,
    required,
    multiple,
    highlightItemOnHover,
    itemProps
  }), [disabled, readOnly, required, multiple, highlightItemOnHover, itemProps]);
  const ref = (0, _useMergedRefs.useMergedRefs)(inputRef, validation.inputRef);
  const hiddenInputName = multiple ? undefined : name;
  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !name) {
      return null;
    }
    return value.map(v => {
      const currentSerializedValue = (0, _resolveValueLabel.stringifyAsValue)(v, itemToStringValue);
      return /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "hidden",
        form: form,
        name: name,
        value: currentSerializedValue,
        disabled: disabled
      }, currentSerializedValue);
    });
  }, [multiple, value, form, name, itemToStringValue, disabled]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_SelectRootContext.SelectRootContext.Provider, {
    value: store,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_SelectRootContext.SelectRootPropsContext.Provider, {
      value: rootPropsContextValue,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_SelectRootContext.SelectFloatingContext.Provider, {
        value: floatingContext,
        children: children
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ...validation.getValidationProps(disabled, {
        onFocus() {
          // Move focus to the trigger element when the hidden input is focused.
          store.state.triggerElement?.focus({
            // Supported in Chrome from 144 (January 2026)
            focusVisible: true
          });
        },
        // Handle browser autofill.
        onChange(event) {
          // Workaround for https://github.com/react/react/issues/9023
          if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
            return;
          }
          const nextValue = event.currentTarget.value;
          const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);
          function handleChange() {
            if (multiple) {
              // Browser autofill only writes a single scalar value.
              return;
            }

            // Preserve the original serialized matching, then fall back to rendered text,
            // which browsers can autofill for primitive values like
            // `value="US">United States`.
            const nextValueLower = nextValue.toLowerCase();
            let matchingIndex = valuesRef.current.findIndex(candidate => (0, _resolveValueLabel.stringifyAsValue)(candidate, itemToStringValue).toLowerCase() === nextValueLower || (0, _resolveValueLabel.stringifyAsLabel)(candidate, itemToStringLabel).toLowerCase() === nextValueLower);
            if (matchingIndex === -1) {
              matchingIndex = valuesRef.current.findIndex((_, index) => {
                const renderedLabel = labelsRef.current[index];
                return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
              });
            }
            const matchingValue = valuesRef.current[matchingIndex];
            if (matchingValue != null) {
              // `setValue` may be canceled by `onValueChange`; rely on `useValueChanged` to
              // mark the field dirty and run validation only when the value actually changes.
              setValue(matchingValue, details);
            }
          }
          store.set('forceMount', true);
          queueMicrotask(handleChange);
        }
      }),
      id: generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined,
      form: form,
      name: hiddenInputName,
      autoComplete: autoComplete,
      value: serializedValue,
      disabled: disabled,
      required: required && !(multiple && hasSelectedValue),
      readOnly: readOnly,
      ref: ref,
      style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden,
      tabIndex: -1,
      "aria-hidden": true,
      suppressHydrationWarning: true
    }), hiddenInputs]
  });
}