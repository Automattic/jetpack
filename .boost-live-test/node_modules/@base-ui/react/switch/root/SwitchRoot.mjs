'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { SwitchRootContext } from "./SwitchRootContext.mjs";
import { stateAttributesMapping } from "../stateAttributesMapping.mjs";
import { dispatchClickWithModifiers } from "../../utils/dispatchClickWithModifiers.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useRegisterFieldControl } from "../../internals/field-register-control/useRegisterFieldControl.mjs";
import { useFormContext } from "../../internals/form-context/FormContext.mjs";
import { useLabelableContext } from "../../internals/labelable-provider/LabelableContext.mjs";
import { useAriaLabelledBy } from "../../internals/labelable-provider/useAriaLabelledBy.mjs";
import { useLabelableId } from "../../internals/labelable-provider/useLabelableId.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useValueChanged } from "../../internals/useValueChanged.mjs";

/**
 * Represents the switch itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const SwitchRoot = /*#__PURE__*/React.forwardRef(function SwitchRoot(componentProps, forwardedRef) {
  const {
    checked: checkedProp,
    className,
    defaultChecked,
    'aria-labelledby': ariaLabelledByProp,
    form,
    id: idProp,
    inputRef: externalInputRef,
    name: nameProp,
    nativeButton = false,
    onCheckedChange,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render,
    uncheckedValue,
    value,
    style,
    ...elementProps
  } = componentProps;
  const {
    clearErrors
  } = useFormContext();
  const {
    state: fieldState,
    setTouched,
    setDirty,
    validityData,
    setFilled,
    setFocused,
    validationMode,
    disabled: fieldDisabled,
    name: fieldName,
    validation
  } = useFieldRootContext();
  const {
    labelId
  } = useLabelableContext();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const inputRef = React.useRef(null);
  const handleInputRef = useMergedRefs(inputRef, externalInputRef, validation.inputRef);
  const switchRef = React.useRef(null);
  const id = useBaseUiId();
  const controlId = useLabelableId({
    id: idProp
  });
  const hiddenInputId = nativeButton ? undefined : controlId;
  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked'
  });
  useRegisterFieldControl(switchRef, id, checked, undefined, !disabled, nameProp);
  useIsoLayoutEffect(() => {
    setFilled(checked);
  }, [checked, setFilled]);
  useValueChanged(checked, () => {
    clearErrors(name);
    setDirty(checked !== validityData.initialValue);
    validation.change(checked);
  });
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton
  });
  const ariaLabelledBy = useAriaLabelledBy(ariaLabelledByProp, labelId, inputRef, !nativeButton, hiddenInputId);
  const rootProps = {
    id: nativeButton ? controlId : id,
    role: 'switch',
    'aria-checked': checked,
    'aria-readonly': readOnly || undefined,
    'aria-required': required || undefined,
    'aria-labelledby': ariaLabelledBy,
    onFocus() {
      if (!disabled) {
        setFocused(true);
      }
    },
    onBlur() {
      const element = inputRef.current;
      if (!element || disabled) {
        return;
      }
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit(element.checked);
      }
    },
    onClick(event) {
      if (readOnly || disabled) {
        return;
      }
      event.preventDefault();
      const input = inputRef.current;
      if (!input) {
        return;
      }
      dispatchClickWithModifiers(input, event);
    }
  };
  const inputProps = {
    ...validation.getValidationProps(disabled),
    checked,
    disabled,
    form,
    id: hiddenInputId,
    name,
    required,
    style: name ? visuallyHiddenInput : visuallyHidden,
    tabIndex: -1,
    type: 'checkbox',
    'aria-hidden': true,
    ref: handleInputRef,
    onChange(event) {
      // Workaround for https://github.com/react/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }
      if (readOnly) {
        event.preventDefault();
        return;
      }
      const nextChecked = event.currentTarget.checked;
      const eventDetails = createChangeEventDetails(REASONS.none, event.nativeEvent);
      onCheckedChange?.(nextChecked, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      setCheckedState(nextChecked);
    },
    onClick(event) {
      // The click dispatched from the root's `onClick` is an implementation detail
      // and must not reach ancestors, which already receive the original click.
      event.stopPropagation();
    },
    onFocus() {
      switchRef.current?.focus();
    },
    // React <19 sets an empty value if `undefined` is passed explicitly
    // To avoid this, we only set the value if it's defined
    ...(value !== undefined ? {
      value
    } : EMPTY_OBJECT)
  };
  const state = React.useMemo(() => ({
    ...fieldState,
    checked,
    disabled,
    readOnly,
    required
  }), [fieldState, checked, disabled, readOnly, required]);
  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, switchRef, buttonRef],
    props: [rootProps, elementProps, getButtonProps, props => validation.getValidationProps(disabled, props)],
    stateAttributesMapping
  });
  return /*#__PURE__*/_jsxs(SwitchRootContext.Provider, {
    value: state,
    children: [element, !checked && name && uncheckedValue !== undefined && /*#__PURE__*/_jsx("input", {
      type: "hidden",
      form: form,
      name: name,
      value: uncheckedValue,
      disabled: disabled
    }), /*#__PURE__*/_jsx("input", {
      ...inputProps,
      suppressHydrationWarning: true
    })]
  });
});
if (process.env.NODE_ENV !== "production") SwitchRoot.displayName = "SwitchRoot";