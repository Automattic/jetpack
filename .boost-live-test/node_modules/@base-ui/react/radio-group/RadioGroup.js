"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useControlled = require("@base-ui/utils/useControlled");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useBaseUiId = require("../internals/useBaseUiId");
var _utils = require("../floating-ui-react/utils");
var _composite = require("../internals/composite/composite");
var _CompositeRoot = require("../internals/composite/root/CompositeRoot");
var _FieldRootContext = require("../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../internals/field-register-control/useRegisterFieldControl");
var _constants = require("../internals/field-constants/constants");
var _useFieldValidation = require("../field/root/useFieldValidation");
var _FieldsetRootContext = require("../fieldset/root/FieldsetRootContext");
var _FormContext = require("../internals/form-context/FormContext");
var _LabelableContext = require("../internals/labelable-provider/LabelableContext");
var _useValueChanged = require("../internals/useValueChanged");
var _RadioGroupContext = require("./RadioGroupContext");
var _jsxRuntime = require("react/jsx-runtime");
const MODIFIER_KEYS = [_composite.SHIFT];

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 */
const RadioGroup = exports.RadioGroup = /*#__PURE__*/React.forwardRef(function RadioGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp,
    readOnly,
    required,
    onValueChange: onValueChangeProp,
    value: externalValue,
    defaultValue,
    form,
    name: nameProp,
    inputRef: inputRefProp,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;
  const {
    setTouched: setFieldTouched,
    setFocused,
    validationMode,
    name: fieldName,
    disabled: fieldDisabled,
    state: fieldState,
    validation,
    setDirty,
    setFilled,
    validityData
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId
  } = (0, _LabelableContext.useLabelableContext)();
  const {
    clearErrors,
    elementRef
  } = (0, _FormContext.useFormContext)();
  const fieldsetContext = (0, _FieldsetRootContext.useFieldsetRootContext)(true);
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const [checkedValue, setCheckedValueUnwrapped] = (0, _useControlled.useControlled)({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value'
  });
  const [touched, setTouched] = React.useState(false);
  const setCheckedValue = (0, _useStableCallback.useStableCallback)((value, eventDetails) => {
    onValueChangeProp?.(value, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setCheckedValueUnwrapped(value);
  });
  const getInputControl = validation.getInputControl;
  const controlRef = React.useMemo(() => ({
    get current() {
      return getInputControl();
    }
  }), [getInputControl]);
  const groupInputRef = React.useRef(null);
  const firstEnabledInputRef = React.useRef(null);

  // Only forwards the public `inputRef` and tracks the current representative for that forwarding.
  // The registry (`validation.registeredInputs`) is authoritative for validation and form-value
  // projection, so the group must not write `validation.inputRef`: a stale, unmounted radio left
  // there would become the Field's fallback once the registry empties and keep blocking submission.
  function setInputRef(hiddenInput) {
    let cleanup = undefined;
    if (inputRefProp) {
      if (typeof inputRefProp === 'function') {
        cleanup = inputRefProp(hiddenInput);
      } else {
        inputRefProp.current = hiddenInput;
      }
    }
    groupInputRef.current = hiddenInput;
    return cleanup;
  }
  const registerInputRef = (0, _useStableCallback.useStableCallback)(input => {
    if (!input || input.disabled) {
      return undefined;
    }
    if (!firstEnabledInputRef.current) {
      firstEnabledInputRef.current = input;
    }
    const currentInput = groupInputRef.current;
    const cleanup = input.checked || currentInput == null || currentInput.disabled ? setInputRef(input) : undefined;

    // Detach when this input unmounts while still forwarded, so consumers don't
    // keep holding a disconnected node. The input may have become the forwarded
    // one after attach (via the re-registration effect), so always return this.
    return () => {
      if (firstEnabledInputRef.current === input) {
        firstEnabledInputRef.current = null;
      }
      if (groupInputRef.current === input) {
        if (cleanup) {
          cleanup();
          groupInputRef.current = null;
        } else {
          void setInputRef(null);
        }
      } else {
        cleanup?.();
      }
    };
  });
  const getFormValue = (0, _useStableCallback.useStableCallback)(() => {
    const formElement = elementRef.current;
    if (!formElement) {
      return checkedValue ?? null;
    }
    for (const input of validation.registeredInputs.keys()) {
      if (input.checked && (0, _useFieldValidation.isEligibleInput)(input, formElement)) {
        return checkedValue ?? null;
      }
    }
    return null;
  });
  (0, _useRegisterFieldControl.useRegisterFieldControl)(controlRef, id, checkedValue ?? null, getFormValue, !disabled, nameProp);
  (0, _useValueChanged.useValueChanged)(checkedValue, () => {
    clearErrors(name);
    setDirty(checkedValue !== validityData.initialValue);
    setFilled(checkedValue != null);
    validation.change(checkedValue);
    const fallbackInput = firstEnabledInputRef.current;
    if (checkedValue == null && fallbackInput && !fallbackInput.disabled) {
      // Imperative re-point outside React's ref lifecycle; the ref-callback cleanup isn't tracked here.
      void setInputRef(fallbackInput);
    }
  });
  const ariaLabelledby = labelId ?? fieldsetContext?.legendId;
  const state = {
    ...fieldState,
    disabled: disabled ?? false,
    required: required ?? false,
    readOnly: readOnly ?? false
  };
  const contextValue = React.useMemo(() => ({
    checkedValue,
    disabled,
    form,
    validation,
    name,
    readOnly,
    registerInputRef,
    required,
    setCheckedValue,
    setTouched,
    touched
  }), [checkedValue, disabled, form, validation, name, readOnly, registerInputRef, required, setCheckedValue, setTouched, touched]);
  const defaultProps = {
    id: idProp,
    role: 'radiogroup',
    'aria-required': required || undefined,
    'aria-disabled': disabled || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-labelledby': ariaLabelledby,
    onFocus() {
      setFocused(true);
    },
    onBlur(event) {
      if (!(0, _utils.contains)(event.currentTarget, event.relatedTarget)) {
        setFieldTouched(true);
        setFocused(false);
        if (validationMode === 'onBlur') {
          validation.commit(checkedValue);
        }
      }
    },
    onKeyDownCapture(event) {
      if (event.key.startsWith('Arrow')) {
        setTouched(true);
        setFocused(true);
      }
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_RadioGroupContext.RadioGroupContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      props: [defaultProps, elementProps, props => validation.getValidationProps(disabled ?? false, props)],
      refs: [forwardedRef],
      stateAttributesMapping: _constants.fieldValidityMapping,
      enableHomeAndEndKeys: false,
      modifierKeys: MODIFIER_KEYS
    })
  });
});
if (process.env.NODE_ENV !== "production") RadioGroup.displayName = "RadioGroup";