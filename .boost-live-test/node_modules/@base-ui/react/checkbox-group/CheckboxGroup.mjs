'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { useBaseUiId } from "../internals/useBaseUiId.mjs";
import { useRenderElement } from "../internals/useRenderElement.mjs";
import { CheckboxGroupContext } from "./CheckboxGroupContext.mjs";
import { isEligibleInput } from "../field/root/useFieldValidation.mjs";
import { useFieldRootContext } from "../internals/field-root-context/FieldRootContext.mjs";
import { useRegisterFieldControl } from "../internals/field-register-control/useRegisterFieldControl.mjs";
import { useLabelableContext } from "../internals/labelable-provider/LabelableContext.mjs";
import { useLabelableId } from "../internals/labelable-provider/useLabelableId.mjs";
import { fieldValidityMapping } from "../internals/field-constants/constants.mjs";
import { useCheckboxGroupParent } from "./useCheckboxGroupParent.mjs";
import { useFormContext } from "../internals/form-context/FormContext.mjs";
import { useValueChanged } from "../internals/useValueChanged.mjs";

/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const CheckboxGroup = /*#__PURE__*/React.forwardRef(function CheckboxGroup(componentProps, forwardedRef) {
  const {
    allValues,
    className,
    defaultValue: defaultValueProp,
    disabled: disabledProp = false,
    id: idProp,
    onValueChange,
    render,
    value: externalValue,
    style,
    ...elementProps
  } = componentProps;
  const {
    disabled: fieldDisabled,
    name: fieldName,
    state: fieldState,
    validation,
    setFilled,
    setDirty,
    validityData
  } = useFieldRootContext();
  const {
    labelId,
    registerControlId,
    getDescriptionProps
  } = useLabelableContext();
  const {
    clearErrors,
    elementRef
  } = useFormContext();
  const disabled = fieldDisabled || disabledProp;
  const defaultValue = defaultValueProp ?? EMPTY_ARRAY;
  const [value, setValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value'
  });
  const setValue = useStableCallback((v, eventDetails) => {
    onValueChange?.(v, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueUnwrapped(v);
  });
  const parent = useCheckboxGroupParent({
    allValues,
    value,
    onValueChange: setValue
  });

  // The group is the field's control and takes its name from `aria-labelledby`, so `Field.Label`
  // must not point `htmlFor` at one arbitrary checkbox inside the group.
  useLabelableId({
    id: null
  });
  const id = useBaseUiId(idProp);
  const getInputControl = validation.getInputControl;
  const controlRef = React.useMemo(() => ({
    get current() {
      return getInputControl();
    }
  }), [getInputControl]);
  const getFormValue = useStableCallback(() => {
    const formElement = elementRef.current;
    if (!formElement) {
      return value;
    }
    const successfulValues = new Set();
    for (const [input, registration] of validation.registeredInputs) {
      if (registration.value !== undefined && input.checked && isEligibleInput(input, formElement)) {
        successfulValues.add(registration.value);
      }
    }
    return value.filter(inputValue => successfulValues.has(inputValue));
  });
  useRegisterFieldControl(controlRef, id, value, getFormValue, !!fieldName && !disabled, fieldName);
  useIsoLayoutEffect(() => {
    setFilled(value.length > 0);
  }, [value, setFilled]);
  useValueChanged(value, () => {
    if (fieldName) {
      clearErrors(fieldName);
    }
    const initialValue = Array.isArray(validityData.initialValue) ? validityData.initialValue : EMPTY_ARRAY;
    setDirty(!areArraysEqual(value, initialValue));
    validation.change(value);
  });
  const state = {
    ...fieldState,
    disabled
  };
  const contextValue = React.useMemo(() => ({
    allValues,
    value,
    setValue,
    parent,
    disabled,
    validation,
    registerControlId
  }), [allValues, value, setValue, parent, disabled, validation, registerControlId]);
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      id: idProp,
      role: 'group',
      'aria-labelledby': labelId
    }, elementProps, getDescriptionProps],
    stateAttributesMapping: fieldValidityMapping
  });
  return /*#__PURE__*/_jsx(CheckboxGroupContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") CheckboxGroup.displayName = "CheckboxGroup";