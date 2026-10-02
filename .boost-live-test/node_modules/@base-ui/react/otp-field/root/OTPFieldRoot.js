"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTPFieldRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _safeReact = require("@base-ui/utils/safeReact");
var _useControlled = require("@base-ui/utils/useControlled");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _warn = require("@base-ui/utils/warn");
var _owner = require("@base-ui/utils/owner");
var _utils = require("../../floating-ui-react/utils");
var _CompositeList = require("../../internals/composite/list/CompositeList");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../../internals/field-register-control/useRegisterFieldControl");
var _FormContext = require("../../internals/form-context/FormContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _useAriaLabelledBy = require("../../internals/labelable-provider/useAriaLabelledBy");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _useRenderElement = require("../../internals/useRenderElement");
var _useValueChanged = require("../../internals/useValueChanged");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _OTPFieldRootContext = require("./OTPFieldRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _otp = require("../utils/otp");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all OTP field parts and manages their state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
const OTPFieldRoot = exports.OTPFieldRoot = /*#__PURE__*/React.forwardRef(function OTPFieldRoot(componentProps, forwardedRef) {
  const {
    'aria-describedby': ariaDescribedByProp,
    'aria-labelledby': ariaLabelledByProp,
    id: idProp,
    autoComplete = 'one-time-code',
    defaultValue = '',
    value: valueProp,
    onValueChange,
    onValueComplete: onValueCompleteProp,
    form,
    length,
    autoSubmit = false,
    mask = false,
    inputMode: inputModeProp,
    validationType = 'numeric',
    normalizeValue,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    name: nameProp,
    onValueInvalid,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    setDirty,
    validityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
    state: fieldState,
    validation,
    validationMode,
    setFocused,
    setTouched
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    clearErrors
  } = (0, _FormContext.useFormContext)();
  const {
    getDescriptionProps,
    labelId
  } = (0, _LabelableContext.useLabelableContext)();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const [valueUnwrapped, setValueUnwrapped] = (0, _useControlled.useControlled)({
    controlled: valueProp,
    default: defaultValue,
    name: 'OTPField',
    state: 'value'
  });
  const rootRef = React.useRef(null);
  const inputRefs = React.useRef([]);
  const pendingFocusRef = React.useRef(null);
  const pendingCompleteValueRef = React.useRef(null);
  const firstInputRef = React.useMemo(() => ({
    get current() {
      return inputRefs.current[0] ?? null;
    }
  }), []);
  const id = (0, _useLabelableId.useLabelableId)({
    id: idProp
  });
  const ariaLabelledBy = (0, _useAriaLabelledBy.useAriaLabelledBy)(ariaLabelledByProp, labelId, firstInputRef, true, id);
  const inputAriaLabelledBy = ariaLabelledByProp == null ? ariaLabelledBy : undefined;
  const fieldDescriptionProps = getDescriptionProps({});
  const ariaDescribedBy = mergeAriaIds(ariaDescribedByProp, fieldDescriptionProps['aria-describedby']);
  const validationConfig = (0, _otp.getOTPValidationConfig)(validationType);
  const pattern = validationConfig?.slotPattern;
  const hiddenInputPattern = validationConfig?.getRootPattern(length);
  const inputMode = inputModeProp ?? validationConfig?.inputMode;
  const hasValidLength = Number.isInteger(length) && length > 0;
  const value = (0, _otp.normalizeOTPValue)(valueUnwrapped, length, validationType, normalizeValue);
  const valueRef = (0, _useValueAsRef.useValueAsRef)(value);
  const filled = value !== '';
  const [inputCount, setInputCount] = React.useState(0);
  const [focusedIndex, setFocusedIndex] = React.useState(() => Math.min(value.length, length - 1));
  const [focused, setFocusedState] = React.useState(false);
  const activeIndex = focused ? Math.min(focusedIndex, Math.max(length - 1, 0)) : Math.min(value.length, length - 1);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setFilled(filled);
  }, [filled, setFilled]);

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOTPFieldRootDevWarnings({
      inputCount,
      length
    });
  }
  (0, _useRegisterFieldControl.useRegisterFieldControl)(firstInputRef, id, value, undefined, !disabled, nameProp);
  const focusInput = (0, _useStableCallback.useStableCallback)(index => {
    const targetIndex = Math.min(Math.max(index, 0), Math.max(inputRefs.current.length - 1, 0));
    const target = inputRefs.current[targetIndex];
    target?.focus();
    target?.select();
  });
  const queueFocusInput = (0, _useStableCallback.useStableCallback)((index, nextValue) => {
    pendingFocusRef.current = {
      index,
      value: nextValue
    };
  });
  function requestSubmit() {
    // The hidden validation input only renders for a valid `length`, but the slots always do,
    // so fall back to the owning form of the first slot.
    let formElement = validation.inputRef.current?.form ?? inputRefs.current[0]?.form ?? null;
    if (form) {
      const associatedElement = (0, _owner.ownerDocument)(rootRef.current).getElementById(form);
      if (associatedElement?.tagName === 'FORM') {
        formElement = associatedElement;
      }
    }
    if (formElement && typeof formElement.requestSubmit === 'function') {
      formElement.requestSubmit();
    }
  }
  function completeValue(completedValue, eventDetails) {
    onValueCompleteProp?.(completedValue, eventDetails);
    if (autoSubmit) {
      requestSubmit();
    }
  }
  (0, _useValueChanged.useValueChanged)(value, () => {
    clearErrors(name);
    setDirty(value !== validityData.initialValue);
    validation.change(value);
    const pendingFocus = pendingFocusRef.current;
    if (pendingFocus != null) {
      pendingFocusRef.current = null;
      if (pendingFocus.value === value) {
        focusInput(pendingFocus.index);
      }
    }
    const pendingCompleteValue = pendingCompleteValueRef.current;
    if (pendingCompleteValue != null) {
      pendingCompleteValueRef.current = null;
      if (pendingCompleteValue.value === value) {
        completeValue(value, pendingCompleteValue.eventDetails);
      }
    }
  });
  const setValue = (0, _useStableCallback.useStableCallback)((nextValue, details) => {
    const normalizedValue = (0, _otp.normalizeOTPValue)(nextValue, length, validationType, normalizeValue);
    const canComplete = details.reason === _reasons.REASONS.inputChange || details.reason === _reasons.REASONS.inputPaste;
    const completeEventDetails = canComplete && normalizedValue.length === length && (valueRef.current.length !== length || details.reason === _reasons.REASONS.inputPaste) ? (0, _createBaseUIEventDetails.createGenericEventDetails)(details.reason, details.event) : null;
    if (normalizedValue === valueRef.current) {
      if (completeEventDetails != null) {
        completeValue(normalizedValue, completeEventDetails);
      }
      return null;
    }
    onValueChange?.(normalizedValue, details);
    if (details.isCanceled) {
      return null;
    }
    setValueUnwrapped(normalizedValue);
    if (completeEventDetails != null) {
      pendingCompleteValueRef.current = {
        value: normalizedValue,
        eventDetails: completeEventDetails
      };
    } else if (normalizedValue.length !== length) {
      pendingCompleteValueRef.current = null;
    }
    return normalizedValue;
  });
  const reportValueInvalid = (0, _useStableCallback.useStableCallback)((invalidValue, details) => {
    onValueInvalid?.(invalidValue, details);
  });
  const handleInputFocus = (0, _useStableCallback.useStableCallback)((index, event) => {
    if (index > valueRef.current.length) {
      focusInput(Math.min(valueRef.current.length, length - 1));
      return;
    }
    setFocusedIndex(index);
    setFocusedState(true);
    setFocused(true);
    event.currentTarget.select();
  });
  const handleInputBlur = (0, _useStableCallback.useStableCallback)(event => {
    if ((0, _utils.contains)(rootRef.current, event.relatedTarget)) {
      return;
    }
    setTouched(true);
    setFocusedState(false);
    setFocused(false);
    if (validationMode === 'onBlur') {
      validation.commit(valueRef.current);
    }
  });
  const getInputId = React.useCallback(index => {
    if (id == null) {
      return undefined;
    }
    return index === 0 ? id : `${id}-${index + 1}`;
  }, [id]);
  const state = React.useMemo(() => ({
    ...fieldState,
    complete: value.length === length,
    disabled,
    filled,
    focused,
    length,
    readOnly,
    required,
    value
  }), [disabled, fieldState, filled, focused, length, readOnly, required, value]);
  const contextValue = React.useMemo(() => ({
    autoComplete,
    activeIndex,
    disabled,
    form,
    focusInput,
    queueFocusInput,
    getInputId,
    handleInputBlur,
    handleInputFocus,
    inputMode,
    inputAriaLabelledBy,
    invalid,
    length,
    mask,
    pattern,
    reportValueInvalid,
    readOnly,
    required,
    normalizeValue,
    setValue,
    state,
    validationType,
    value
  }), [activeIndex, autoComplete, disabled, focusInput, form, getInputId, handleInputBlur, handleInputFocus, inputMode, inputAriaLabelledBy, invalid, length, mask, pattern, queueFocusInput, readOnly, reportValueInvalid, required, normalizeValue, setValue, state, validationType, value]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, rootRef],
    state,
    props: [{
      role: 'group',
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.rootStateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeList.CompositeList, {
    elementsRef: inputRefs,
    onMapChange: newMap => {
      setInputCount(newMap.size);
    },
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_OTPFieldRootContext.OTPFieldRootContext.Provider, {
      value: contextValue,
      children: [element, hasValidLength && /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        ...validation.getValidationProps(disabled, {
          onFocus() {
            focusInput(0);
          },
          onChange(event) {
            if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
              return;
            }
            const rawValue = event.currentTarget.value;
            const [normalizedValue, didRejectCharacters] = (0, _otp.normalizeOTPValueWithDetails)(rawValue, length, validationType, normalizeValue);
            if (didRejectCharacters) {
              reportValueInvalid(rawValue, (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.inputChange, event.nativeEvent));
            }
            const committedValue = setValue(normalizedValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputChange, event.nativeEvent));
            if (committedValue != null && committedValue !== '') {
              queueFocusInput(committedValue.length - 1, committedValue);
            }
          }
        }),
        ref: validation.inputRef,
        type: "text",
        id: id && name == null ? `${id}-hidden-input` : undefined,
        form: form,
        name: name,
        value: value,
        autoComplete: autoComplete,
        inputMode: inputMode,
        minLength: length,
        maxLength: length,
        pattern: hiddenInputPattern,
        disabled: disabled,
        readOnly: readOnly,
        required: required,
        "aria-hidden": true,
        tabIndex: -1,
        style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden
      })]
    })
  });
});
if (process.env.NODE_ENV !== "production") OTPFieldRoot.displayName = "OTPFieldRoot";
function mergeAriaIds(...values) {
  const ids = values.flatMap(value => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined;
}
function useOTPFieldRootDevWarnings(parameters) {
  const {
    inputCount,
    length
  } = parameters;
  React.useEffect(() => {
    if (!Number.isInteger(length) || length <= 0 || inputCount === 0 || inputCount === length) {
      return;
    }
    const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
    const message = '<OTPField.Root> `length` must match the number of rendered ' + `<OTPField.Input /> parts. Received \`length={${length}}\` but rendered ` + `${inputCount} input${inputCount === 1 ? '' : 's'}.`;
    (0, _warn.warn)(message, ownerStackMessage);
  }, [inputCount, length]);
  React.useEffect(() => {
    if (Number.isInteger(length) && length > 0) {
      return;
    }
    const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
    (0, _warn.warn)(`<OTPField.Root> \`length\` must be a positive integer. Received \`length={${String(length)}}\`.`, ownerStackMessage);
  }, [length]);
}