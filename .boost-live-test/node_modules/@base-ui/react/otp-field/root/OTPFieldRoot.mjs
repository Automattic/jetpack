'use client';

import * as React from 'react';
import { SafeReact } from '@base-ui/utils/safeReact';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { warn } from '@base-ui/utils/warn';
import { ownerDocument } from '@base-ui/utils/owner';
import { contains } from "../../floating-ui-react/utils.mjs";
import { CompositeList } from "../../internals/composite/list/CompositeList.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useRegisterFieldControl } from "../../internals/field-register-control/useRegisterFieldControl.mjs";
import { useFormContext } from "../../internals/form-context/FormContext.mjs";
import { useLabelableContext } from "../../internals/labelable-provider/LabelableContext.mjs";
import { useAriaLabelledBy } from "../../internals/labelable-provider/useAriaLabelledBy.mjs";
import { useLabelableId } from "../../internals/labelable-provider/useLabelableId.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useValueChanged } from "../../internals/useValueChanged.mjs";
import { createChangeEventDetails, createGenericEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { OTPFieldRootContext } from "./OTPFieldRootContext.mjs";
import { rootStateAttributesMapping } from "../utils/stateAttributesMapping.mjs";
import { getOTPValidationConfig, normalizeOTPValue, normalizeOTPValueWithDetails } from "../utils/otp.mjs";

/**
 * Groups all OTP field parts and manages their state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const OTPFieldRoot = /*#__PURE__*/React.forwardRef(function OTPFieldRoot(componentProps, forwardedRef) {
  const {
    'aria-describedby': ariaDescribedByProp,
    'aria-labelledby': ariaLabelledByProp,
    id: idProp,
    autoComplete = 'one-time-code',
    defaultValue = '',
    value: valueProp,
    onValueChange,
    onValueComplete: onValueCompleteProp,
    form,
    length,
    autoSubmit = false,
    mask = false,
    inputMode: inputModeProp,
    validationType = 'numeric',
    normalizeValue,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    name: nameProp,
    onValueInvalid,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    setDirty,
    validityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
    state: fieldState,
    validation,
    validationMode,
    setFocused,
    setTouched
  } = useFieldRootContext();
  const {
    clearErrors
  } = useFormContext();
  const {
    getDescriptionProps,
    labelId
  } = useLabelableContext();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const [valueUnwrapped, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'OTPField',
    state: 'value'
  });
  const rootRef = React.useRef(null);
  const inputRefs = React.useRef([]);
  const pendingFocusRef = React.useRef(null);
  const pendingCompleteValueRef = React.useRef(null);
  const firstInputRef = React.useMemo(() => ({
    get current() {
      return inputRefs.current[0] ?? null;
    }
  }), []);
  const id = useLabelableId({
    id: idProp
  });
  const ariaLabelledBy = useAriaLabelledBy(ariaLabelledByProp, labelId, firstInputRef, true, id);
  const inputAriaLabelledBy = ariaLabelledByProp == null ? ariaLabelledBy : undefined;
  const fieldDescriptionProps = getDescriptionProps({});
  const ariaDescribedBy = mergeAriaIds(ariaDescribedByProp, fieldDescriptionProps['aria-describedby']);
  const validationConfig = getOTPValidationConfig(validationType);
  const pattern = validationConfig?.slotPattern;
  const hiddenInputPattern = validationConfig?.getRootPattern(length);
  const inputMode = inputModeProp ?? validationConfig?.inputMode;
  const hasValidLength = Number.isInteger(length) && length > 0;
  const value = normalizeOTPValue(valueUnwrapped, length, validationType, normalizeValue);
  const valueRef = useValueAsRef(value);
  const filled = value !== '';
  const [inputCount, setInputCount] = React.useState(0);
  const [focusedIndex, setFocusedIndex] = React.useState(() => Math.min(value.length, length - 1));
  const [focused, setFocusedState] = React.useState(false);
  const activeIndex = focused ? Math.min(focusedIndex, Math.max(length - 1, 0)) : Math.min(value.length, length - 1);
  useIsoLayoutEffect(() => {
    setFilled(filled);
  }, [filled, setFilled]);

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOTPFieldRootDevWarnings({
      inputCount,
      length
    });
  }
  useRegisterFieldControl(firstInputRef, id, value, undefined, !disabled, nameProp);
  const focusInput = useStableCallback(index => {
    const targetIndex = Math.min(Math.max(index, 0), Math.max(inputRefs.current.length - 1, 0));
    const target = inputRefs.current[targetIndex];
    target?.focus();
    target?.select();
  });
  const queueFocusInput = useStableCallback((index, nextValue) => {
    pendingFocusRef.current = {
      index,
      value: nextValue
    };
  });
  function requestSubmit() {
    // The hidden validation input only renders for a valid `length`, but the slots always do,
    // so fall back to the owning form of the first slot.
    let formElement = validation.inputRef.current?.form ?? inputRefs.current[0]?.form ?? null;
    if (form) {
      const associatedElement = ownerDocument(rootRef.current).getElementById(form);
      if (associatedElement?.tagName === 'FORM') {
        formElement = associatedElement;
      }
    }
    if (formElement && typeof formElement.requestSubmit === 'function') {
      formElement.requestSubmit();
    }
  }
  function completeValue(completedValue, eventDetails) {
    onValueCompleteProp?.(completedValue, eventDetails);
    if (autoSubmit) {
      requestSubmit();
    }
  }
  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(value !== validityData.initialValue);
    validation.change(value);
    const pendingFocus = pendingFocusRef.current;
    if (pendingFocus != null) {
      pendingFocusRef.current = null;
      if (pendingFocus.value === value) {
        focusInput(pendingFocus.index);
      }
    }
    const pendingCompleteValue = pendingCompleteValueRef.current;
    if (pendingCompleteValue != null) {
      pendingCompleteValueRef.current = null;
      if (pendingCompleteValue.value === value) {
        completeValue(value, pendingCompleteValue.eventDetails);
      }
    }
  });
  const setValue = useStableCallback((nextValue, details) => {
    const normalizedValue = normalizeOTPValue(nextValue, length, validationType, normalizeValue);
    const canComplete = details.reason === REASONS.inputChange || details.reason === REASONS.inputPaste;
    const completeEventDetails = canComplete && normalizedValue.length === length && (valueRef.current.length !== length || details.reason === REASONS.inputPaste) ? createGenericEventDetails(details.reason, details.event) : null;
    if (normalizedValue === valueRef.current) {
      if (completeEventDetails != null) {
        completeValue(normalizedValue, completeEventDetails);
      }
      return null;
    }
    onValueChange?.(normalizedValue, details);
    if (details.isCanceled) {
      return null;
    }
    setValueUnwrapped(normalizedValue);
    if (completeEventDetails != null) {
      pendingCompleteValueRef.current = {
        value: normalizedValue,
        eventDetails: completeEventDetails
      };
    } else if (normalizedValue.length !== length) {
      pendingCompleteValueRef.current = null;
    }
    return normalizedValue;
  });
  const reportValueInvalid = useStableCallback((invalidValue, details) => {
    onValueInvalid?.(invalidValue, details);
  });
  const handleInputFocus = useStableCallback((index, event) => {
    if (index > valueRef.current.length) {
      focusInput(Math.min(valueRef.current.length, length - 1));
      return;
    }
    setFocusedIndex(index);
    setFocusedState(true);
    setFocused(true);
    event.currentTarget.select();
  });
  const handleInputBlur = useStableCallback(event => {
    if (contains(rootRef.current, event.relatedTarget)) {
      return;
    }
    setTouched(true);
    setFocusedState(false);
    setFocused(false);
    if (validationMode === 'onBlur') {
      validation.commit(valueRef.current);
    }
  });
  const getInputId = React.useCallback(index => {
    if (id == null) {
      return undefined;
    }
    return index === 0 ? id : `${id}-${index + 1}`;
  }, [id]);
  const state = React.useMemo(() => ({
    ...fieldState,
    complete: value.length === length,
    disabled,
    filled,
    focused,
    length,
    readOnly,
    required,
    value
  }), [disabled, fieldState, filled, focused, length, readOnly, required, value]);
  const contextValue = React.useMemo(() => ({
    autoComplete,
    activeIndex,
    disabled,
    form,
    focusInput,
    queueFocusInput,
    getInputId,
    handleInputBlur,
    handleInputFocus,
    inputMode,
    inputAriaLabelledBy,
    invalid,
    length,
    mask,
    pattern,
    reportValueInvalid,
    readOnly,
    required,
    normalizeValue,
    setValue,
    state,
    validationType,
    value
  }), [activeIndex, autoComplete, disabled, focusInput, form, getInputId, handleInputBlur, handleInputFocus, inputMode, inputAriaLabelledBy, invalid, length, mask, pattern, queueFocusInput, readOnly, reportValueInvalid, required, normalizeValue, setValue, state, validationType, value]);
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, rootRef],
    state,
    props: [{
      role: 'group',
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy
    }, elementProps],
    stateAttributesMapping: rootStateAttributesMapping
  });
  return /*#__PURE__*/_jsx(CompositeList, {
    elementsRef: inputRefs,
    onMapChange: newMap => {
      setInputCount(newMap.size);
    },
    children: /*#__PURE__*/_jsxs(OTPFieldRootContext.Provider, {
      value: contextValue,
      children: [element, hasValidLength && /*#__PURE__*/_jsx("input", {
        ...validation.getValidationProps(disabled, {
          onFocus() {
            focusInput(0);
          },
          onChange(event) {
            if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
              return;
            }
            const rawValue = event.currentTarget.value;
            const [normalizedValue, didRejectCharacters] = normalizeOTPValueWithDetails(rawValue, length, validationType, normalizeValue);
            if (didRejectCharacters) {
              reportValueInvalid(rawValue, createGenericEventDetails(REASONS.inputChange, event.nativeEvent));
            }
            const committedValue = setValue(normalizedValue, createChangeEventDetails(REASONS.inputChange, event.nativeEvent));
            if (committedValue != null && committedValue !== '') {
              queueFocusInput(committedValue.length - 1, committedValue);
            }
          }
        }),
        ref: validation.inputRef,
        type: "text",
        id: id && name == null ? `${id}-hidden-input` : undefined,
        form: form,
        name: name,
        value: value,
        autoComplete: autoComplete,
        inputMode: inputMode,
        minLength: length,
        maxLength: length,
        pattern: hiddenInputPattern,
        disabled: disabled,
        readOnly: readOnly,
        required: required,
        "aria-hidden": true,
        tabIndex: -1,
        style: name ? visuallyHiddenInput : visuallyHidden
      })]
    })
  });
});
if (process.env.NODE_ENV !== "production") OTPFieldRoot.displayName = "OTPFieldRoot";
function mergeAriaIds(...values) {
  const ids = values.flatMap(value => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined;
}
function useOTPFieldRootDevWarnings(parameters) {
  const {
    inputCount,
    length
  } = parameters;
  React.useEffect(() => {
    if (!Number.isInteger(length) || length <= 0 || inputCount === 0 || inputCount === length) {
      return;
    }
    const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
    const message = '<OTPField.Root> `length` must match the number of rendered ' + `<OTPField.Input /> parts. Received \`length={${length}}\` but rendered ` + `${inputCount} input${inputCount === 1 ? '' : 's'}.`;
    warn(message, ownerStackMessage);
  }, [inputCount, length]);
  React.useEffect(() => {
    if (Number.isInteger(length) && length > 0) {
      return;
    }
    const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
    warn(`<OTPField.Root> \`length\` must be a positive integer. Received \`length={${String(length)}}\`.`, ownerStackMessage);
  }, [length]);
}