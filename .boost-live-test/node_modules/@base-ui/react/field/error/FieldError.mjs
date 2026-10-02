'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useLabelableContext } from "../../internals/labelable-provider/LabelableContext.mjs";
import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import { useFormContext } from "../../internals/form-context/FormContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
const stateAttributesMapping = {
  ...fieldValidityMapping,
  ...transitionStatusMapping
};

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldError = /*#__PURE__*/React.forwardRef(function FieldError(componentProps, forwardedRef) {
  const {
    render,
    id: idProp,
    className,
    match,
    style,
    ...elementProps
  } = componentProps;
  const id = useBaseUiId(idProp);
  const {
    validityData,
    state: fieldState,
    name
  } = useFieldRootContext(false);
  const {
    setMessageIds
  } = useLabelableContext();
  const {
    errors
  } = useFormContext();
  const formError = name && Object.hasOwn(errors, name) ? errors[name] : null;
  const hasFormError = !!(Array.isArray(formError) ? formError.length : formError);
  const hasSpecificMatch = typeof match === 'string';
  let rendered = false;
  if (match === true) {
    rendered = true;
  } else if (fieldState.disabled) {
    rendered = false;
  } else if (hasSpecificMatch) {
    rendered = Boolean(validityData.state[match]);
  } else {
    rendered = hasFormError || validityData.state.valid === false;
  }
  const {
    mounted,
    transitionStatus,
    setMounted
  } = useTransitionStatus(rendered);
  useIsoLayoutEffect(() => {
    if (!rendered || !id) {
      return undefined;
    }
    setMessageIds(v => v.concat(id));
    return () => {
      setMessageIds(v => v.filter(item => item !== id));
    };
  }, [rendered, id, setMessageIds]);
  const errorRef = React.useRef(null);
  const [lastRenderedMessage, setLastRenderedMessage] = React.useState(null);
  const [lastRenderedMessageKey, setLastRenderedMessageKey] = React.useState(null);
  let error = validityData.error;
  if (!hasSpecificMatch && hasFormError) {
    error = formError;
  } else if (validityData.errors.length > 1) {
    error = validityData.errors;
  }
  let errorMessage = error;
  if (Array.isArray(error)) {
    errorMessage = error.length > 1 ? /*#__PURE__*/_jsx("ul", {
      children: error.map(message => /*#__PURE__*/_jsx("li", {
        children: message
      }, message))
    }) : error[0];
  }
  const errorKey = Array.isArray(error) ? JSON.stringify(error) : error;
  if (rendered && errorKey !== lastRenderedMessageKey) {
    setLastRenderedMessageKey(errorKey);
    setLastRenderedMessage(errorMessage);
  }
  useOpenChangeComplete({
    open: rendered,
    ref: errorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    }
  });
  const state = {
    ...fieldState,
    transitionStatus
  };
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, errorRef],
    state,
    props: [{
      id,
      children: rendered ? errorMessage : lastRenderedMessage
    }, elementProps],
    stateAttributesMapping,
    enabled: mounted
  });
  if (!mounted) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") FieldError.displayName = "FieldError";