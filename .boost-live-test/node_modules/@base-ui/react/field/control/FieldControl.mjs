'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useRegisterFieldControl } from "../../internals/field-register-control/useRegisterFieldControl.mjs";
import { useFormContext } from "../../internals/form-context/FormContext.mjs";
import { useLabelableContext } from "../../internals/labelable-provider/LabelableContext.mjs";
import { useLabelableId } from "../../internals/labelable-provider/useLabelableId.mjs";
import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useValueChanged } from "../../internals/useValueChanged.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { activeElement } from "../../floating-ui-react/utils.mjs";

/**
 * The form control to label and validate.
 * Renders an `<input>` element.
 *
 * You can omit this part and use any Base UI input component instead. For example,
 * [Input](https://base-ui.com/react/components/input), [Checkbox](https://base-ui.com/react/components/checkbox),
 * or [Select](https://base-ui.com/react/components/select), among others, will work with Field out of the box.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldControl = /*#__PURE__*/React.forwardRef(function FieldControl(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    name: nameProp,
    value: valueProp,
    disabled: disabledProp = false,
    onValueChange,
    defaultValue,
    autoFocus = false,
    style,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState,
    name: fieldName,
    disabled: fieldDisabled,
    setTouched,
    setDirty,
    validityData,
    setFocused,
    setFilled,
    validationMode,
    validation
  } = useFieldRootContext();
  const {
    clearErrors,
    elementRef: formElementRef,
    submitCountRef
  } = useFormContext();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const state = {
    ...fieldState,
    disabled
  };
  const {
    labelId
  } = useLabelableContext();
  const id = useLabelableId({
    id: idProp
  });
  const [valueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'FieldControl',
    state: 'value'
  });
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueUnwrapped : undefined;
  // The DOM value is always a string, so dirty comparisons must serialize the controlled value.
  const serializedValue = value == null ? undefined : String(value);
  const getValueFromInput = useStableCallback(() => validation.inputRef.current?.value);
  useRegisterFieldControl(validation.inputRef, id, serializedValue, getValueFromInput, !disabled, nameProp);
  useIsoLayoutEffect(() => {
    const currentValue = serializedValue ?? validation.inputRef.current?.value;
    if (currentValue !== undefined) {
      setFilled(currentValue !== '');
    }
  }, [serializedValue, validation.inputRef, setFilled]);
  useValueChanged(serializedValue, () => {
    if (serializedValue === undefined) {
      return;
    }
    clearErrors(name);
    setDirty(serializedValue !== (validityData.initialValue ?? ''));
    validation.change(serializedValue);
  });
  const inputRef = React.useRef(null);
  const enterValidationTimeout = useTimeout();
  useIsoLayoutEffect(() => {
    if (autoFocus && inputRef.current === activeElement(ownerDocument(inputRef.current))) {
      setFocused(true);
    }
  }, [autoFocus, setFocused]);
  const element = useRenderElement('input', componentProps, {
    ref: [forwardedRef, inputRef],
    state,
    props: [{
      id,
      disabled,
      name,
      ref: validation.inputRef,
      'aria-labelledby': labelId,
      autoFocus,
      ...(isControlled ? {
        value
      } : {
        defaultValue
      }),
      onChange(event) {
        const inputValue = event.currentTarget.value;
        const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
        onValueChange?.(inputValue, details);

        // Controlled values sync from the `value` prop instead, so that a value the consumer
        // rejects or rewrites never reaches the field state.
        if (isControlled) {
          return;
        }

        // `validation.change` reads `markedDirtyRef`, so update dirty before validating.
        setDirty(inputValue !== (validityData.initialValue ?? ''));
        setFilled(inputValue !== '');

        // Workaround for https://github.com/react/react/issues/9023
        if (!event.nativeEvent.defaultPrevented && !details.isCanceled) {
          clearErrors(name);
          validation.change(inputValue);
        }
      },
      onFocus() {
        setFocused(true);
      },
      onBlur(event) {
        setTouched(true);
        setFocused(false);
        if (validationMode === 'onBlur') {
          const inputValue = event.currentTarget.value;
          validation.commit(inputValue);
          if (isControlled) {
            // Controlled blur handlers can normalize the value before this microtask runs.
            // A rewrite back to the initial value is a programmatic reset: the field looks
            // pristine, so committing it would only surface `valueMissing` noise.
            queueMicrotask(() => {
              const nextValue = validation.inputRef.current?.value;
              if (nextValue !== undefined && nextValue !== inputValue && nextValue !== (validityData.initialValue ?? '')) {
                validation.commit(nextValue);
              }
            });
          }
        }
      },
      onKeyDown(event) {
        if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
          setTouched(true);
          const value = event.currentTarget.value;
          const form = event.currentTarget.form;
          if (form && form === formElementRef.current && !event.defaultPrevented) {
            const input = event.currentTarget;
            const submitCount = submitCountRef.current;

            // Implicit submission runs after keydown. Fall back unless Form handles it first.
            enterValidationTimeout.start(0, () => {
              if (submitCountRef.current === submitCount) {
                validation.commit(input.value);
              }
            });
          } else {
            validation.commit(value);
          }
        }
      }
    }, elementProps, props => validation.getValidationProps(disabled, props)],
    stateAttributesMapping: fieldValidityMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") FieldControl.displayName = "FieldControl";