'use client';

import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useClick, useDismiss, useFloatingRootContext, useListNavigation, useTypeahead } from "../../floating-ui-react/index.mjs";
import { SelectFloatingContext, SelectRootContext, SelectRootPropsContext } from "./SelectRootContext.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useRegisterFieldControl } from "../../internals/field-register-control/useRegisterFieldControl.mjs";
import { useLabelableId } from "../../internals/labelable-provider/useLabelableId.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { selectors } from "../store.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useFormContext } from "../../internals/form-context/FormContext.mjs";
import { stringifyAsLabel, stringifyAsValue } from "../../internals/resolveValueLabel.mjs";
import { defaultItemEquality, findSelectionIndex, isSelectedValueDirty } from "../../internals/itemEquality.mjs";
import { useValueChanged } from "../../internals/useValueChanged.mjs";
import { useOpenInteractionType } from "../../utils/useOpenInteractionType.mjs";
import { getMaxScrollOffset, normalizeScrollOffset } from "../../utils/scrollEdges.mjs";
import { FOCUSABLE_POPUP_PROPS } from "../../utils/popups/index.mjs";
import { mergeProps } from "../../merge-props/index.mjs";
import { NOOP } from "../../internals/noop.mjs";

/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SelectRoot(props) {
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
    isItemEqualToValue = defaultItemEquality,
    highlightItemOnHover = true,
    children
  } = props;
  const {
    clearErrors
  } = useFormContext();
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
  } = useFieldRootContext();
  const generatedId = useLabelableId({
    id
  });
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? defaultValue ?? EMPTY_ARRAY : defaultValue,
    name: 'Select',
    state: 'value'
  });
  const [open, setOpenUnwrapped] = useControlled({
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
  } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps: interactionTypeProps
  } = useOpenInteractionType(open);
  const store = useRefWithInit(() => new ReactStore({
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
    popupProps: EMPTY_OBJECT,
    triggerProps: EMPTY_OBJECT,
    triggerElement: null,
    positionerElement: null,
    listElement: null,
    popupSide: null,
    scrollUpArrowVisible: false,
    scrollDownArrowVisible: false,
    hasScrollArrows: false
  }, {
    setValue: NOOP,
    setOpen: NOOP,
    handleScrollArrowVisibility: NOOP,
    onOpenChangeComplete: NOOP,
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
  }, selectors)).current;
  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const triggerElement = store.useState('triggerElement');
  const positionerElement = store.useState('positionerElement');
  const previousOpenMethod = usePreviousValue(openMethod);
  const renderedOpenMethod = openMethod ?? previousOpenMethod;
  const serializedValue = React.useMemo(() => {
    // In multiple mode the shared input is nameless; per-value entries are submitted via
    // `hiddenInputs`. Its value is therefore irrelevant, and passing the whole array to
    // `stringifyAsValue` would invoke a user `itemToStringValue` with an array it doesn't expect.
    if (multiple) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);
  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map(currentValue => stringifyAsValue(currentValue, itemToStringValue));
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);
  const controlRef = useValueAsRef(triggerElement);
  const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);
  useRegisterFieldControl(controlRef, generatedId, value, getStringifiedValueForForm, !disabled, nameProp);

  // Mirror the `hasSelectedValue` store selector so the Field's filled state agrees with the
  // trigger/value placeholder semantics (a value serializing to `''` counts as empty).
  const hasSelectedValue = multiple ? Array.isArray(value) && value.length > 0 : value != null && serializedValue !== '';
  useIsoLayoutEffect(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);
  useIsoLayoutEffect(function syncSelectedIndex() {
    const nextIndex = findSelectionIndex(valuesRef.current, value, isItemEqualToValue, multiple);
    if (nextIndex === null) {
      selectedItemTextRef.current = null;
    }
    if (open) {
      return;
    }
    store.set('selectedIndex', nextIndex);
  }, [multiple, open, value, isItemEqualToValue, store]);
  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value, validityData.initialValue, isItemEqualToValue));
    validation.change(value);
  });
  const setOpen = useStableCallback((nextOpen, eventDetails) => {
    onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setOpenUnwrapped(nextOpen);
    if (!nextOpen && (eventDetails.reason === REASONS.focusOut || eventDetails.reason === REASONS.outsidePress)) {
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit(value);
      }
    }
  });
  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({
      activeIndex: null,
      openMethod: null,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false
    });
    onOpenChangeComplete?.(false);
  });
  useOpenChangeComplete({
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
  const setValue = useStableCallback((nextValue, eventDetails) => {
    onValueChange?.(nextValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueUnwrapped(nextValue);
  });
  const handleScrollArrowVisibility = useStableCallback(scroller => {
    const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
    const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
    const shouldShowUp = scrollTop > 0;
    const shouldShowDown = scrollTop < maxScrollTop;
    store.set('scrollUpArrowVisible', shouldShowUp);
    store.set('scrollDownArrowVisible', shouldShowDown);
  });
  const floatingContext = useFloatingRootContext({
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
  const click = useClick(floatingContext, {
    enabled: !disabled,
    event: 'mousedown'
  });
  const dismiss = useDismiss(floatingContext);
  const listNavigation = useListNavigation(floatingContext, {
    enabled: !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }
      store.set('activeIndex', nextActiveIndex);
    },
    focusItemOnHover: highlightItemOnHover
  });
  const typeahead = useTypeahead(floatingContext, {
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
    disabledIndices: index => isElementDisabled(listRef.current[index]),
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails(REASONS.none));
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    }
  });

  // `Select.Trigger` applies the id itself from the store, so it's deliberately not merged here.
  const mergedTriggerProps = React.useMemo(() => mergeProps(typeahead.reference, listNavigation.reference, dismiss.reference, click.reference, interactionTypeProps), [click.reference, typeahead.reference, listNavigation.reference, dismiss.reference, interactionTypeProps]);
  const popupProps = React.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, typeahead.floating, listNavigation.floating, dismiss.floating), [typeahead.floating, listNavigation.floating, dismiss.floating]);
  const itemProps = listNavigation.item ?? EMPTY_OBJECT;
  store.useContextCallback('setValue', setValue);
  store.useContextCallback('setOpen', setOpen);
  store.useContextCallback('handleScrollArrowVisibility', handleScrollArrowVisibility);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  // The prop bags must be in the store before the parts render. `useSyncedValues` writes in a
  // layout effect, after all descendants have rendered.
  useOnFirstRender(() => {
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
  const ref = useMergedRefs(inputRef, validation.inputRef);
  const hiddenInputName = multiple ? undefined : name;
  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !name) {
      return null;
    }
    return value.map(v => {
      const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
      return /*#__PURE__*/_jsx("input", {
        type: "hidden",
        form: form,
        name: name,
        value: currentSerializedValue,
        disabled: disabled
      }, currentSerializedValue);
    });
  }, [multiple, value, form, name, itemToStringValue, disabled]);
  return /*#__PURE__*/_jsxs(SelectRootContext.Provider, {
    value: store,
    children: [/*#__PURE__*/_jsx(SelectRootPropsContext.Provider, {
      value: rootPropsContextValue,
      children: /*#__PURE__*/_jsx(SelectFloatingContext.Provider, {
        value: floatingContext,
        children: children
      })
    }), /*#__PURE__*/_jsx("input", {
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
          const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
          function handleChange() {
            if (multiple) {
              // Browser autofill only writes a single scalar value.
              return;
            }

            // Preserve the original serialized matching, then fall back to rendered text,
            // which browsers can autofill for primitive values like
            // `value="US">United States`.
            const nextValueLower = nextValue.toLowerCase();
            let matchingIndex = valuesRef.current.findIndex(candidate => stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower || stringifyAsLabel(candidate, itemToStringLabel).toLowerCase() === nextValueLower);
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
      style: name ? visuallyHiddenInput : visuallyHidden,
      tabIndex: -1,
      "aria-hidden": true,
      suppressHydrationWarning: true
    }), hiddenInputs]
  });
}