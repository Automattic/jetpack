'use client';

import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { NOOP } from "../../internals/noop.mjs";
import { stateAttributesMapping } from "../utils/stateAttributesMapping.mjs";
import { dispatchClickWithModifiers } from "../../utils/dispatchClickWithModifiers.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { ACTIVE_COMPOSITE_ITEM } from "../../internals/composite/constants.mjs";
import { CompositeItem } from "../../internals/composite/item/CompositeItem.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useFieldItemContext } from "../../field/item/FieldItemContext.mjs";
import { useLabelableContext } from "../../internals/labelable-provider/LabelableContext.mjs";
import { useAriaLabelledBy } from "../../internals/labelable-provider/useAriaLabelledBy.mjs";
import { useLabelableId } from "../../internals/labelable-provider/useLabelableId.mjs";
import { useRadioGroupContext } from "../../radio-group/RadioGroupContext.mjs";
import { serializeValue } from "../../internals/serializeValue.mjs";
import { RadioRootContext } from "./RadioRootContext.mjs";

/**
 * Represents the radio button itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const RadioRoot = /*#__PURE__*/React.forwardRef(function RadioRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    readOnly: readOnlyProp = false,
    required: requiredProp = false,
    'aria-labelledby': ariaLabelledByProp,
    value,
    inputRef: inputRefProp,
    nativeButton = false,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;
  const groupContext = useRadioGroupContext();
  const {
    disabled: disabledGroup,
    readOnly: readOnlyGroup,
    required: requiredGroup,
    form: formGroup,
    checkedValue,
    touched = false,
    validation,
    name,
    setCheckedValue = NOOP,
    setTouched = NOOP,
    registerInputRef = NOOP
  } = groupContext ?? {};
  const {
    setTouched: setFieldTouched,
    setFilled,
    state: fieldState,
    disabled: fieldDisabled
  } = useFieldRootContext();
  const fieldItemContext = useFieldItemContext();
  const {
    labelId,
    getDescriptionProps
  } = useLabelableContext();
  const disabled = fieldDisabled || fieldItemContext.disabled || disabledGroup || disabledProp;
  const readOnly = readOnlyGroup || readOnlyProp;
  const required = requiredGroup || requiredProp;
  const form = formGroup;
  const checked = groupContext ? checkedValue === value : value === '';
  const radioRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const registerFieldInput = validation?.registerInput;
  const registerInput = React.useCallback(element => registerFieldInput?.(element, {
    controlRef: radioRef,
    value: undefined
  }), [registerFieldInput]);
  const mergedInputRef = useMergedRefs(inputRefProp, inputRef, registerInputRef, registerInput);
  useIsoLayoutEffect(() => {
    if (inputRef.current?.checked) {
      setFilled(true);
    }
  }, [setFilled]);
  useIsoLayoutEffect(() => {
    if (!inputRef.current) {
      return;
    }
    if (disabled && checked) {
      registerInputRef(null);
      return;
    }
    registerInputRef(inputRef.current);
  }, [checked, disabled, registerInputRef]);
  const id = useBaseUiId();
  const inputId = useLabelableId({
    id: idProp
  });
  const hiddenInputId = nativeButton ? undefined : inputId;
  const ariaLabelledBy = useAriaLabelledBy(ariaLabelledByProp, labelId, inputRef, !nativeButton, hiddenInputId);
  const rootProps = {
    role: 'radio',
    'aria-checked': checked,
    'aria-labelledby': ariaLabelledBy,
    [ACTIVE_COMPOSITE_ITEM]: checked ? '' : undefined,
    id: nativeButton ? inputId : id,
    onKeyDown(event) {
      if (event.key === 'Enter') {
        // Radio only activates with Space. Preventing the keydown's default
        // stops useButton from turning Enter into a click.
        event.preventDefault();
      }
    },
    onClick(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }
      event.preventDefault();
      const input = inputRef.current;
      if (!input) {
        return;
      }
      dispatchClickWithModifiers(input, event);
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled || readOnly || !touched) {
        return;
      }
      inputRef.current?.click();
      setTouched(false);
    }
  };
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton,
    composite: false
  });
  const inputProps = {
    type: 'radio',
    ref: mergedInputRef,
    form,
    id: hiddenInputId,
    name,
    tabIndex: -1,
    style: name ? visuallyHiddenInput : visuallyHidden,
    'aria-hidden': true,
    ...(value !== undefined ? {
      value: serializeValue(value)
    } : EMPTY_OBJECT),
    disabled,
    checked,
    required,
    readOnly,
    onChange(event) {
      // Workaround for https://github.com/react/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }
      if (disabled || readOnly || value === undefined) {
        return;
      }
      const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
      setCheckedValue(value, details);
      if (details.isCanceled) {
        return;
      }
      setFieldTouched(true);
    },
    onClick(event) {
      // Clicks dispatched on the input from the root's `onClick` and `onFocus` are an
      // implementation detail and must not reach ancestors.
      event.stopPropagation();
    },
    onFocus() {
      radioRef.current?.focus();
    }
  };
  const state = React.useMemo(() => ({
    ...fieldState,
    required,
    disabled,
    readOnly,
    checked
  }), [fieldState, disabled, readOnly, checked, required]);
  const contextValue = state;
  const isRadioGroup = groupContext !== undefined;
  const refs = [forwardedRef, radioRef, buttonRef];
  const props = [rootProps, elementProps, getButtonProps, getDescriptionProps, validation ? validationProps => validation.getValidationProps(disabled, validationProps) : EMPTY_OBJECT];
  const element = useRenderElement('span', componentProps, {
    enabled: !isRadioGroup,
    state,
    ref: refs,
    props,
    stateAttributesMapping
  });
  return /*#__PURE__*/_jsxs(RadioRootContext.Provider, {
    value: contextValue,
    children: [isRadioGroup ? /*#__PURE__*/_jsx(CompositeItem, {
      tag: "span",
      render: render,
      className: className,
      style: style,
      state: state,
      refs: refs,
      props: props,
      stateAttributesMapping: stateAttributesMapping
    }) : element, /*#__PURE__*/_jsx("input", {
      ...inputProps,
      suppressHydrationWarning: true
    })]
  });
});
if (process.env.NODE_ENV !== "production") RadioRoot.displayName = "RadioRoot";