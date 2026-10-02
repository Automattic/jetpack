'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { createGenericEventDetails } from "../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../internals/reasons.mjs";
import { FormContext } from "../internals/form-context/FormContext.mjs";
import { useRenderElement } from "../internals/useRenderElement.mjs";
import { useValueChanged } from "../internals/useValueChanged.mjs";

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const Form = /*#__PURE__*/React.forwardRef(function Form(componentProps, forwardedRef) {
  const {
    render,
    className,
    validationMode = 'onSubmit',
    errors: externalErrors,
    onSubmit,
    onFormSubmit,
    actionsRef,
    style,
    ...elementProps
  } = componentProps;
  const formRef = React.useRef({
    fields: new Map()
  });
  const elementRef = React.useRef(null);
  const submittedRef = React.useRef(false);
  const submitCountRef = React.useRef(0);
  const focusFirstInvalid = useStableCallback(() => {
    // A field can be invalid without a focusable control (for example a checkbox group whose
    // custom validation failed while every checkbox is unmounted, disabled, or reassociated).
    // Keep submission blocked, but move focus to the first invalid field that has a usable control.
    // Registration order can diverge from DOM order (keyed fields reordered without
    // remounting, portals), so pick the first control by document position. For controls
    // in disconnected trees (e.g. separate shadow roots), where document position is
    // implementation-specific, keep registration order.
    let hasInvalid = false;
    let firstControl = null;
    for (const field of formRef.current.fields.values()) {
      if (field.validityData.state.valid !== false) {
        continue;
      }
      hasInvalid = true;
      const control = field.controlRef.current;
      if (control && (!firstControl || comesBeforeInSameTree(control, firstControl))) {
        firstControl = control;
      }
    }
    if (firstControl) {
      firstControl.focus();
      if (firstControl.tagName === 'INPUT') {
        firstControl.select();
      }
      return true;
    }
    return hasInvalid;
  });
  const [errors, setErrors] = React.useState(externalErrors);
  useValueChanged(externalErrors, () => {
    setErrors(externalErrors);
  });
  React.useEffect(() => {
    if (!submittedRef.current) {
      return;
    }
    submittedRef.current = false;
    focusFirstInvalid();
  }, [errors, focusFirstInvalid]);
  React.useImperativeHandle(actionsRef, () => ({
    validate(fieldName) {
      if (fieldName) {
        Array.from(formRef.current.fields.values()).find(field => field.name === fieldName)?.validate();
      } else {
        formRef.current.fields.forEach(field => {
          field.validate();
        });
      }
    }
  }), []);
  const element = useRenderElement('form', componentProps, {
    ref: [forwardedRef, elementRef],
    props: [{
      noValidate: true,
      onSubmit(event) {
        submitCountRef.current += 1;

        // Async validation isn't supported to stop the submit event.
        formRef.current.fields.forEach(field => {
          field.validate();
        });
        if (focusFirstInvalid()) {
          event.preventDefault();
          return;
        }
        submittedRef.current = true;
        onSubmit?.(event);
        if (onFormSubmit) {
          event.preventDefault();
          const formValues = {};
          formRef.current.fields.forEach(field => {
            if (field.name) {
              formValues[field.name] = field.getValue();
            }
          });
          onFormSubmit(formValues, createGenericEventDetails(REASONS.none, event.nativeEvent));
        }
      }
    }, elementProps]
  });
  const clearErrors = useStableCallback(name => {
    if (!name) {
      return;
    }
    setErrors(previousErrors => {
      if (!previousErrors || !Object.hasOwn(previousErrors, name)) {
        return previousErrors;
      }
      const nextErrors = {
        ...previousErrors
      };
      delete nextErrors[name];
      return nextErrors;
    });
  });
  const contextValue = React.useMemo(() => ({
    elementRef,
    formRef,
    validationMode,
    errors: errors ?? EMPTY_OBJECT,
    clearErrors,
    submitCountRef
  }), [formRef, validationMode, errors, clearErrors]);
  return /*#__PURE__*/_jsx(FormContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") Form.displayName = "Form";
/* eslint-disable no-bitwise */
function comesBeforeInSameTree(element, reference) {
  const position = element.compareDocumentPosition(reference);
  return (position & Node.DOCUMENT_POSITION_DISCONNECTED) === 0 && (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}