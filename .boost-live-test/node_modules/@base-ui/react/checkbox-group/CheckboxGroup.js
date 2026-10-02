"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CheckboxGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useControlled = require("@base-ui/utils/useControlled");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _empty = require("@base-ui/utils/empty");
var _areArraysEqual = require("@base-ui/utils/areArraysEqual");
var _useBaseUiId = require("../internals/useBaseUiId");
var _useRenderElement = require("../internals/useRenderElement");
var _CheckboxGroupContext = require("./CheckboxGroupContext");
var _useFieldValidation = require("../field/root/useFieldValidation");
var _FieldRootContext = require("../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../internals/field-register-control/useRegisterFieldControl");
var _LabelableContext = require("../internals/labelable-provider/LabelableContext");
var _useLabelableId = require("../internals/labelable-provider/useLabelableId");
var _constants = require("../internals/field-constants/constants");
var _useCheckboxGroupParent = require("./useCheckboxGroupParent");
var _FormContext = require("../internals/form-context/FormContext");
var _useValueChanged = require("../internals/useValueChanged");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
const CheckboxGroup = exports.CheckboxGroup = /*#__PURE__*/React.forwardRef(function CheckboxGroup(componentProps, forwardedRef) {
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
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId,
    registerControlId,
    getDescriptionProps
  } = (0, _LabelableContext.useLabelableContext)();
  const {
    clearErrors,
    elementRef
  } = (0, _FormContext.useFormContext)();
  const disabled = fieldDisabled || disabledProp;
  const defaultValue = defaultValueProp ?? _empty.EMPTY_ARRAY;
  const [value, setValueUnwrapped] = (0, _useControlled.useControlled)({
    controlled: externalValue,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value'
  });
  const setValue = (0, _useStableCallback.useStableCallback)((v, eventDetails) => {
    onValueChange?.(v, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueUnwrapped(v);
  });
  const parent = (0, _useCheckboxGroupParent.useCheckboxGroupParent)({
    allValues,
    value,
    onValueChange: setValue
  });

  // The group is the field's control and takes its name from `aria-labelledby`, so `Field.Label`
  // must not point `htmlFor` at one arbitrary checkbox inside the group.
  (0, _useLabelableId.useLabelableId)({
    id: null
  });
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const getInputControl = validation.getInputControl;
  const controlRef = React.useMemo(() => ({
    get current() {
      return getInputControl();
    }
  }), [getInputControl]);
  const getFormValue = (0, _useStableCallback.useStableCallback)(() => {
    const formElement = elementRef.current;
    if (!formElement) {
      return value;
    }
    const successfulValues = new Set();
    for (const [input, registration] of validation.registeredInputs) {
      if (registration.value !== undefined && input.checked && (0, _useFieldValidation.isEligibleInput)(input, formElement)) {
        successfulValues.add(registration.value);
      }
    }
    return value.filter(inputValue => successfulValues.has(inputValue));
  });
  (0, _useRegisterFieldControl.useRegisterFieldControl)(controlRef, id, value, getFormValue, !!fieldName && !disabled, fieldName);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setFilled(value.length > 0);
  }, [value, setFilled]);
  (0, _useValueChanged.useValueChanged)(value, () => {
    if (fieldName) {
      clearErrors(fieldName);
    }
    const initialValue = Array.isArray(validityData.initialValue) ? validityData.initialValue : _empty.EMPTY_ARRAY;
    setDirty(!(0, _areArraysEqual.areArraysEqual)(value, initialValue));
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
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      id: idProp,
      role: 'group',
      'aria-labelledby': labelId
    }, elementProps, getDescriptionProps],
    stateAttributesMapping: _constants.fieldValidityMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CheckboxGroupContext.CheckboxGroupContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") CheckboxGroup.displayName = "CheckboxGroup";