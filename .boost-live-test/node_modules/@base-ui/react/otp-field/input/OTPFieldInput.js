"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTPFieldInput = void 0;
var React = _interopRequireWildcard(require("react"));
var _safeReact = require("@base-ui/utils/safeReact");
var _warn = require("@base-ui/utils/warn");
var _utils = require("../../floating-ui-react/utils");
var _useCompositeListItem = require("../../internals/composite/list/useCompositeListItem");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _OTPFieldRootContext = require("../root/OTPFieldRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _otp = require("../utils/otp");
/**
 * An individual OTP character input.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
const OTPFieldInput = exports.OTPFieldInput = /*#__PURE__*/React.forwardRef(function OTPFieldInput(componentProps, forwardedRef) {
  const {
    'aria-label': externalAriaLabel,
    'aria-labelledby': externalAriaLabelledBy,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    activeIndex,
    autoComplete,
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
  } = (0, _OTPFieldRootContext.useOTPFieldRootContext)();
  const {
    ref: listItemRef,
    index
  } = (0, _useCompositeListItem.useCompositeListItem)({
    guess: true
  });
  const inputRef = React.useRef(null);
  const direction = (0, _DirectionContext.useDirection)();
  const slotValue = value[index] ?? '';
  const inputState = (0, _OTPFieldRootContext.getOTPFieldInputState)(state, slotValue, index);
  const slotAriaLabel = externalAriaLabel;
  const inheritedLabel = externalAriaLabelledBy ?? inputAriaLabelledBy;
  const ariaLabel = index === 0 ? undefined : slotAriaLabel;

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (index !== 0 || slotAriaLabel == null || inputRef.current?.labels?.length) {
        return;
      }
      const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
      (0, _warn.warn)('<OTPField.Input> ignores `aria-label` on the first input. Use a `<label>` or `<Field.Label>` to label the OTP field.', ownerStackMessage);
    }, [index, slotAriaLabel]);
  }
  const inputProps = {
    id: getInputId(index),
    value: slotValue,
    type: mask ? 'password' : 'text',
    inputMode,
    autoComplete: index === 0 ? autoComplete : 'off',
    autoCorrect: 'off',
    spellCheck: 'false',
    enterKeyHint: index === length - 1 ? 'done' : 'next',
    // Only the first slot has a max length to avoid password manager bubbles appearing after later inputs.
    maxLength: index === 0 ? length : undefined,
    tabIndex: activeIndex === index ? 0 : -1,
    disabled,
    form,
    pattern,
    readOnly,
    required,
    'aria-labelledby': ariaLabel == null ? inheritedLabel : undefined,
    'aria-invalid': !disabled && invalid ? true : undefined,
    'aria-label': ariaLabel,
    onMouseDown(event) {
      if (event.defaultPrevented || disabled) {
        return;
      }
      event.preventDefault();
      focusInput(index);
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled) {
        return;
      }
      handleInputFocus(index, event);
    },
    onBlur(event) {
      if (event.defaultPrevented) {
        return;
      }
      handleInputBlur(event);
    },
    onChange(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }
      const rawValue = event.currentTarget.value;
      const [nextDigits, didRejectCharacters] = (0, _otp.normalizeOTPValueWithDetails)(rawValue, length, validationType, normalizeValue);
      if (didRejectCharacters) {
        reportValueInvalid(rawValue, (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.inputChange, event.nativeEvent));
      }
      if (nextDigits === '') {
        if (rawValue === '') {
          setValue((0, _otp.removeOTPCharacter)(value, index), (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputClear, event.nativeEvent));
        } else if (slotValue !== '') {
          event.currentTarget.value = slotValue;
          event.currentTarget.select();
        }
        return;
      }
      const nextValue = (0, _otp.replaceOTPValue)(value, index, nextDigits, length, validationType, normalizeValue);
      const committedValue = setValue(nextValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputChange, event.nativeEvent));
      if (committedValue != null) {
        const nextInput = Math.min(index + nextDigits.length, length - 1);
        queueFocusInput(nextInput, committedValue);
      }
    },
    onKeyDown(event) {
      if (event.defaultPrevented || disabled) {
        return;
      }
      const firstIndex = 0;
      const lastIndex = Math.max(length - 1, firstIndex);
      const endTargetIndex = Math.min(value.length, lastIndex);
      const hasBoundaryModifier = (event.ctrlKey || event.metaKey) && !event.altKey;
      const isRtl = direction === 'rtl';
      const previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
      const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
      if (event.key === previousKey) {
        (0, _utils.stopEvent)(event);
        focusInput(hasBoundaryModifier ? firstIndex : Math.max(firstIndex, index - 1));
        return;
      }
      if (event.key === nextKey) {
        (0, _utils.stopEvent)(event);
        focusInput(hasBoundaryModifier ? endTargetIndex : Math.min(lastIndex, index + 1));
        return;
      }
      if (event.key === 'Home' || event.key === 'ArrowUp') {
        (0, _utils.stopEvent)(event);
        focusInput(firstIndex);
        return;
      }
      if (event.key === 'End' || event.key === 'ArrowDown') {
        (0, _utils.stopEvent)(event);
        focusInput(endTargetIndex);
        return;
      }
      if (readOnly) {
        return;
      }
      function setKeyboardValue(nextValue, targetIndex) {
        const committedValue = setValue(nextValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.keyboard, event.nativeEvent));
        if (committedValue != null) {
          queueFocusInput(targetIndex, committedValue);
        }
      }
      if (event.key === 'Backspace' && hasBoundaryModifier) {
        (0, _utils.stopEvent)(event);
        setKeyboardValue('', firstIndex);
        return;
      }
      if (event.key === 'Delete') {
        (0, _utils.stopEvent)(event);
        setKeyboardValue((0, _otp.removeOTPCharacter)(value, index), index);
        return;
      }
      const inputValue = event.currentTarget.value;
      const fullSelection = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === inputValue.length;
      if (event.key.length === 1 && fullSelection && slotValue === event.key) {
        (0, _utils.stopEvent)(event);
        if (index < length - 1) {
          focusInput(index + 1);
        }
        return;
      }
      if (event.key === 'Backspace') {
        (0, _utils.stopEvent)(event);
        const targetIndex = Math.max(firstIndex, index - 1);
        const deleteIndex = slotValue === '' ? targetIndex : index;
        setKeyboardValue((0, _otp.removeOTPCharacter)(value, deleteIndex), targetIndex);
      }
    },
    onPaste(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }
      let rawValue = '';
      try {
        rawValue = event.clipboardData?.getData('text/plain') ?? '';
      } catch {
        /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
        if (process.env.NODE_ENV !== 'production') {
          const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
          (0, _warn.warn)('<OTPField.Input> could not read clipboard text during paste handling.', ownerStackMessage);
        }
        return;
      }
      event.preventDefault();
      const [nextDigits, didRejectCharacters] = (0, _otp.normalizeOTPValueWithDetails)(rawValue, length, validationType, normalizeValue);
      if (didRejectCharacters) {
        reportValueInvalid(rawValue, (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.inputPaste, event.nativeEvent));
      }
      if (nextDigits === '') {
        return;
      }
      const committedValue = setValue((0, _otp.replaceOTPValue)(value, index, nextDigits, length, validationType, normalizeValue), (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputPaste, event.nativeEvent));
      if (committedValue != null) {
        const nextInput = Math.min(index + nextDigits.length, length - 1);
        queueFocusInput(nextInput, committedValue);
      }
    }
  };
  const element = (0, _useRenderElement.useRenderElement)('input', componentProps, {
    ref: [forwardedRef, listItemRef, inputRef],
    state: inputState,
    props: [inputProps, elementProps],
    stateAttributesMapping: _stateAttributesMapping.inputStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") OTPFieldInput.displayName = "OTPFieldInput";