"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _constants = require("../../internals/field-constants/constants");
var _FieldsetRootContext = require("../../fieldset/root/FieldsetRootContext");
var _FormContext = require("../../internals/form-context/FormContext");
var _labelableProvider = require("../../internals/labelable-provider");
var _useRenderElement = require("../../internals/useRenderElement");
var _useFieldValidation = require("./useFieldValidation");
var _useFieldControlRegistration = require("../../internals/field-register-control/useFieldControlRegistration");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * @internal
 */const FieldRootInner = /*#__PURE__*/React.forwardRef(function FieldRootInner(componentProps, forwardedRef) {
  const {
    errors,
    validationMode: formValidationMode,
    submitCountRef
  } = (0, _FormContext.useFormContext)();
  const {
    render,
    className,
    validate: validateProp,
    validationDebounceTime = 0,
    validationMode = formValidationMode,
    name,
    disabled: disabledProp = false,
    invalid: invalidProp,
    dirty: dirtyProp,
    touched: touchedProp,
    actionsRef,
    style,
    ...elementProps
  } = componentProps;
  const disabledFieldset = (0, _FieldsetRootContext.useFieldsetRootContext)(true)?.disabled;
  const validate = (0, _useStableCallback.useStableCallback)(validateProp || (() => null));
  const disabled = disabledFieldset || disabledProp;
  const [touchedState, setTouchedUnwrapped] = React.useState(false);
  const [dirtyState, setDirtyUnwrapped] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const dirty = dirtyProp ?? dirtyState;
  const touched = touchedProp ?? touchedState;
  const markedDirtyRef = React.useRef(dirty);
  const registeredFieldIdRef = React.useRef(undefined);
  const [registeredFieldName, setRegisteredFieldName] = React.useState();
  const effectiveName = name ?? registeredFieldName;
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (dirtyProp !== undefined) {
      markedDirtyRef.current = dirtyProp;
    }
  }, [dirtyProp]);
  const setDirty = (0, _useStableCallback.useStableCallback)(value => {
    if (dirtyProp !== undefined) {
      return;
    }
    if (value) {
      markedDirtyRef.current = true;
    }
    setDirtyUnwrapped(value);
  });
  const setTouched = (0, _useStableCallback.useStableCallback)(value => {
    if (touchedProp !== undefined) {
      return;
    }
    setTouchedUnwrapped(value);
  });
  const shouldValidateOnChange = (0, _useStableCallback.useStableCallback)(() => validationMode === 'onChange' || validationMode === 'onSubmit' && submitCountRef.current > 0);
  const formError = effectiveName && Object.hasOwn(errors, effectiveName) ? errors[effectiveName] : null;
  const hasFormError = !!(Array.isArray(formError) ? formError.length : formError);
  const invalid = invalidProp === true || hasFormError;
  const [validityData, setValidityData] = React.useState({
    state: _constants.DEFAULT_VALIDITY_STATE,
    error: '',
    errors: [],
    value: null,
    initialValue: null
  });

  // App-controlled invalidity (the `invalid` prop and `<Form>` errors) keeps the field marked
  // invalid even while disabled. Only computed validity (native constraints and `validate`)
  // is suppressed when disabled, matching `:disabled` not participating in constraint validation.
  const valid = !invalid && (disabled ? null : validityData.state.valid);
  const state = React.useMemo(() => ({
    disabled,
    touched,
    dirty,
    valid,
    filled,
    focused
  }), [disabled, touched, dirty, valid, filled, focused]);
  const validation = (0, _useFieldValidation.useFieldValidation)({
    setValidityData,
    validate,
    validityData,
    validationDebounceTime,
    invalid,
    markedDirtyRef,
    state,
    shouldValidateOnChange,
    validationMode,
    registeredFieldIdRef
  });
  const [validateFieldControl, registerFieldControl] = (0, _useFieldControlRegistration.useFieldControlRegistration)({
    change: validation.change,
    commit: validation.commit,
    invalid,
    markedDirtyRef,
    name,
    setRegisteredFieldName,
    registeredFieldIdRef,
    setValidityData,
    validityData
  });
  React.useImperativeHandle(actionsRef, () => ({
    validate: validateFieldControl
  }), [validateFieldControl]);
  const contextValue = React.useMemo(() => ({
    invalid,
    name: effectiveName,
    validityData,
    setValidityData,
    disabled,
    setTouched,
    setDirty,
    setFilled,
    setFocused,
    validationMode,
    shouldValidateOnChange,
    state,
    registerFieldControl,
    validation
  }), [invalid, effectiveName, validityData, disabled, setTouched, setDirty, setFilled, setFocused, validationMode, shouldValidateOnChange, state, registerFieldControl, validation]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: _constants.fieldValidityMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_FieldRootContext.FieldRootContext.Provider, {
    value: contextValue,
    children: element
  });
});

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
if (process.env.NODE_ENV !== "production") FieldRootInner.displayName = "FieldRootInner";
const FieldRoot = exports.FieldRoot = /*#__PURE__*/React.forwardRef(function FieldRoot(componentProps, forwardedRef) {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_labelableProvider.LabelableProvider, {
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(FieldRootInner, {
      ...componentProps,
      ref: forwardedRef
    })
  });
});
if (process.env.NODE_ENV !== "production") FieldRoot.displayName = "FieldRoot";