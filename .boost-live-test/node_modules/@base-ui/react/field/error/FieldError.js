"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldError = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _constants = require("../../internals/field-constants/constants");
var _FormContext = require("../../internals/form-context/FormContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _jsxRuntime = require("react/jsx-runtime");
const stateAttributesMapping = {
  ..._constants.fieldValidityMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldError = exports.FieldError = /*#__PURE__*/React.forwardRef(function FieldError(componentProps, forwardedRef) {
  const {
    render,
    id: idProp,
    className,
    match,
    style,
    ...elementProps
  } = componentProps;
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const {
    validityData,
    state: fieldState,
    name
  } = (0, _FieldRootContext.useFieldRootContext)(false);
  const {
    setMessageIds
  } = (0, _LabelableContext.useLabelableContext)();
  const {
    errors
  } = (0, _FormContext.useFormContext)();
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
  } = (0, _useTransitionStatus.useTransitionStatus)(rendered);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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
    errorMessage = error.length > 1 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("ul", {
      children: error.map(message => /*#__PURE__*/(0, _jsxRuntime.jsx)("li", {
        children: message
      }, message))
    }) : error[0];
  }
  const errorKey = Array.isArray(error) ? JSON.stringify(error) : error;
  if (rendered && errorKey !== lastRenderedMessageKey) {
    setLastRenderedMessageKey(errorKey);
    setLastRenderedMessage(errorMessage);
  }
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
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
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
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