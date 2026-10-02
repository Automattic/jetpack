"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldInput = void 0;
var React = _interopRequireWildcard(require("react"));
var _safeReact = require("@base-ui/utils/safeReact");
var _warn = require("@base-ui/utils/warn");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _formatNumber = require("@base-ui/utils/formatNumber");
var _NumberFieldRootContext = require("../root/NumberFieldRootContext");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../../internals/field-register-control/useRegisterFieldControl");
var _FormContext = require("../../internals/form-context/FormContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _parse = require("../utils/parse");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _useValueChanged = require("../../internals/useValueChanged");
var _reasons = require("../../internals/reasons");
var _validate = require("../utils/validate");
const NAVIGATE_KEYS = new Set(['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape']);

/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldInput = exports.NumberFieldInput = /*#__PURE__*/React.forwardRef(function NumberFieldInput(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    allowInputSyncRef,
    formatOptionsRef,
    getAllowedNonNumericKeys,
    getStepAmount,
    id,
    incrementValue,
    inputMode,
    max,
    min,
    name,
    nameProp,
    setValue,
    state,
    setInputValue,
    locale,
    inputRef,
    onValueCommitted,
    lastChangedValueRef,
    hasPendingCommitRef,
    valueRef
  } = (0, _NumberFieldRootContext.useNumberFieldRootContext)();
  const {
    disabled,
    readOnly,
    required,
    value,
    inputValue
  } = state;
  const {
    clearErrors
  } = (0, _FormContext.useFormContext)();
  const {
    validationMode,
    setTouched,
    setFocused,
    invalid,
    shouldValidateOnChange,
    validation
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId
  } = (0, _LabelableContext.useLabelableContext)();
  const blockRevalidationRef = React.useRef(false);
  const pendingCaretRef = React.useRef(null);
  (0, _useRegisterFieldControl.useRegisterFieldControl)(inputRef, id, value, undefined, !disabled, nameProp);

  // After a paste splices text into the controlled value, the browser would otherwise drop the
  // caret at the end of the new value. Restore it just after the inserted text.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (pendingCaretRef.current != null) {
      const caret = pendingCaretRef.current;
      pendingCaretRef.current = null;
      inputRef.current?.setSelectionRange(caret, caret);
    }
  });
  (0, _useValueChanged.useValueChanged)(value, () => {
    clearErrors(name);
    if (blockRevalidationRef.current && !shouldValidateOnChange()) {
      blockRevalidationRef.current = false;
      return;
    }
    validation.change(value);
  });
  const inputProps = {
    id,
    required,
    disabled,
    readOnly,
    inputMode,
    value: inputValue,
    type: 'text',
    autoComplete: 'off',
    autoCorrect: 'off',
    spellCheck: 'false',
    'aria-roledescription': 'Number field',
    'aria-invalid': !disabled && invalid ? true : undefined,
    'aria-labelledby': labelId,
    // If the server's locale does not match the client's locale, the formatting may not match,
    // causing a hydration mismatch.
    suppressHydrationWarning: true,
    onFocus(event) {
      // Read-only inputs are still focusable; only the value-changing handlers stay gated on it.
      if (event.defaultPrevented || disabled) {
        return;
      }
      setFocused(true);
    },
    onBlur(event) {
      if (event.defaultPrevented || disabled) {
        return;
      }
      setTouched(true);
      setFocused(false);
      if (readOnly) {
        return;
      }
      const hadManualInput = !allowInputSyncRef.current;
      const hadPendingProgrammaticChange = hasPendingCommitRef.current;
      allowInputSyncRef.current = true;
      if (inputValue.trim() === '') {
        const clearDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputClear, event.nativeEvent);
        setValue(null, clearDetails);
        // Respect a canceled clear, mirroring the non-empty blur path below.
        if (clearDetails.isCanceled) {
          return;
        }
        if (validationMode === 'onBlur') {
          validation.commit(null);
        }
        // Don't report a commit when blurring an already-empty field that the user never
        // interacted with: nothing was cleared and no programmatic change is pending.
        if (hadManualInput || hadPendingProgrammaticChange || value !== null) {
          onValueCommitted(null, (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.inputClear, event.nativeEvent));
        }
        return;
      }
      const formatOptions = formatOptionsRef.current;
      const parsedValue = (0, _parse.parseNumber)(inputValue, locale, formatOptions);
      if (parsedValue === null) {
        return;
      }

      // Avoid applying Intl's default precision unless the format opts into rounding.
      const hasRoundingOptions = (0, _validate.hasNumberFormatRoundingOptions)(formatOptions);
      let committed;
      if (!hadManualInput && !hasRoundingOptions) {
        // No rounding options and no manual edit: the visible text is purely formatted
        // display, so keep the authoritative numeric value as-is rather than re-parsing the
        // rounded text and discarding precision (e.g. focus/blur with no edits, or blur after
        // a programmatic change).
        committed = value;
      } else if (hasRoundingOptions) {
        // Explicit rounding options apply to the committed value, whether typed or external.
        committed = (0, _validate.removeFloatingPointErrors)(parsedValue, formatOptions);
      } else {
        committed = parsedValue;
      }
      const nextEventDetails = (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.inputBlur, event.nativeEvent);
      const shouldUpdateValue = value !== committed;
      const shouldCommit = hadManualInput || shouldUpdateValue || hadPendingProgrammaticChange;

      // Use the stored value after `setValue` clamps it.
      let committedValue = committed;
      if (shouldUpdateValue) {
        const changeDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputBlur, event.nativeEvent);
        blockRevalidationRef.current = true;
        setValue(committed, changeDetails);
        if (changeDetails.isCanceled) {
          blockRevalidationRef.current = false;
          return;
        }
        committedValue = lastChangedValueRef.current;
        // If validation normalized back to the current value, `useValueChanged` won't fire to
        // reset the flag, so reset it here or the next external change won't revalidate.
        if (committedValue === value) {
          blockRevalidationRef.current = false;
        }
      }
      if (validationMode === 'onBlur') {
        validation.commit(committedValue);
      }
      if (shouldCommit) {
        onValueCommitted(committedValue, nextEventDetails);
      }

      // Normalize only the displayed text
      const canonicalText = (0, _formatNumber.formatNumber)(committedValue, locale, formatOptions);
      if (inputValue !== canonicalText) {
        setInputValue(canonicalText);
      }
    },
    onChange(event) {
      // Workaround for https://github.com/react/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }
      allowInputSyncRef.current = false;
      const targetValue = event.currentTarget.value;
      if (targetValue.trim() === '') {
        setInputValue(targetValue);
        setValue(null, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputClear, event.nativeEvent));
        return;
      }

      // Update the input text immediately and only fire onValueChange if the typed value is
      // currently parseable into a number. This preserves good UX for IME
      // composition/partial input while still providing live numeric updates when possible.
      const allowedNonNumericKeys = getAllowedNonNumericKeys();
      const isValidCharacterString = Array.from(targetValue).every(ch => (0, _parse.isNumeralChar)(ch) || _parse.ANY_MINUS_DETECT_RE.test(ch) || allowedNonNumericKeys.has(ch) ||
      // Bidi/format controls are stripped by `parseNumber`; don't let them reject the string
      // (RTL locales insert them around exponent/currency signs, e.g. scientific notation).
      _parse.FORMAT_CONTROL_DETECT_RE.test(ch));
      if (!isValidCharacterString) {
        return;
      }
      const parsedValue = (0, _parse.parseNumber)(targetValue, locale, formatOptionsRef.current);
      setInputValue(targetValue);
      if (parsedValue !== null) {
        setValue(parsedValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputChange, event.nativeEvent));
      }
    },
    onKeyDown(event) {
      if (event.defaultPrevented || readOnly || disabled) {
        return;
      }
      const nativeEvent = event.nativeEvent;

      // Snapshot the dirty state without clearing it: navigation/allowed keys (ArrowLeft, Tab,
      // Enter, Escape, …) return early without changing the value, so marking the input synced
      // here would wrongly discard dirty-input authority. Only the value-changing branches below
      // mark it synced.
      const hadManualInput = !allowInputSyncRef.current;
      const allowedNonNumericKeys = getAllowedNonNumericKeys();
      let isAllowedNonNumericKey = allowedNonNumericKeys.has(event.key);
      const {
        decimal,
        currency,
        percentSign
      } = (0, _parse.getNumberLocaleDetails)(locale, formatOptionsRef.current);
      const selectionStart = event.currentTarget.selectionStart;
      const selectionEnd = event.currentTarget.selectionEnd;
      const isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;
      const selectionContainsIndex = index => selectionStart != null && selectionEnd != null && index >= selectionStart && index < selectionEnd;

      // Only allow a single sign character: permit it when there is no existing sign of either
      // kind, when all text is selected, or when the selection covers the existing sign so it's
      // being replaced.
      const signGroups = [[_parse.ANY_MINUS_DETECT_RE, _parse.ANY_MINUS_RE], [_parse.ANY_PLUS_DETECT_RE, _parse.ANY_PLUS_RE]];
      signGroups.forEach(([detectRe, globalRe]) => {
        if (detectRe.test(event.key) && Array.from(allowedNonNumericKeys).some(k => detectRe.test(k))) {
          const existingIndex = inputValue.search(globalRe);
          const isReplacingExisting = existingIndex !== -1 && selectionContainsIndex(existingIndex);
          isAllowedNonNumericKey = !(_parse.ANY_MINUS_DETECT_RE.test(inputValue) || _parse.ANY_PLUS_DETECT_RE.test(inputValue)) || isAllSelected || isReplacingExisting;
        }
      });

      // Only allow one of each symbol.
      [decimal, currency, percentSign].forEach(symbol => {
        if (event.key === symbol) {
          const symbolIndex = inputValue.indexOf(symbol);
          const isSymbolHighlighted = selectionContainsIndex(symbolIndex);
          isAllowedNonNumericKey = symbolIndex === -1 || isAllSelected || isSymbolHighlighted;
        }
      });
      const isNavigateKey = NAVIGATE_KEYS.has(event.key);
      // Alt+ArrowUp/ArrowDown selects smallStep, so don't treat it as a bypass modifier.
      const isStepKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      if (
      // Allow composition events (e.g., pinyin)
      // event.nativeEvent.isComposing does not work in Safari:
      // https://bugs.webkit.org/show_bug.cgi?id=165004
      event.which === 229 || event.altKey && !isStepKey || event.ctrlKey || event.metaKey || isAllowedNonNumericKey || (0, _parse.isNumeralChar)(event.key) || isNavigateKey) {
        return;
      }

      // Home/End jump to the corresponding bound, but only when that bound is defined.
      let boundaryValue = null;
      if (event.key === 'Home' && min != null) {
        boundaryValue = min;
      } else if (event.key === 'End' && max != null) {
        boundaryValue = max;
      }

      // Let the browser handle multi-character keys we don't act on (PageUp, Insert, F-keys,
      // Home/End without min/max); invalid single characters are still blocked below.
      if (event.key.length > 1 && !isStepKey && boundaryValue === null) {
        return;
      }

      // Step from the authoritative numeric value unless the input has unsaved manual edits.
      // When the text is already synced, parsing the rounded display would collapse precision,
      // so pass no `currentValue` and let `incrementValue` fall back to the numeric state
      // (mirrors the button path).
      const currentValue = hadManualInput ? (0, _parse.parseNumber)(inputValue, locale, formatOptionsRef.current) : null;
      const amount = getStepAmount(event);

      // Prevent insertion of text or caret from moving.
      event.preventDefault();
      event.stopPropagation();
      const commitDetails = (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.keyboard, nativeEvent);
      let changed = false;
      if (isStepKey || boundaryValue !== null) {
        allowInputSyncRef.current = true;
      }
      if (isStepKey) {
        // When stepping from the synced numeric state, refresh the commit ref to the current
        // value so a canceled step can't commit a stale `lastChangedValueRef` left over from an
        // earlier change (mirrors the button path).
        if (!hadManualInput) {
          lastChangedValueRef.current = valueRef.current;
        }
        changed = incrementValue(amount, {
          direction: event.key === 'ArrowUp' ? 1 : -1,
          currentValue,
          event: nativeEvent,
          reason: _reasons.REASONS.keyboard
        });
      } else if (boundaryValue !== null) {
        changed = setValue(boundaryValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.keyboard, nativeEvent));
      }

      // `changed` is only true when `setValue` applied the change, which records the stored
      // (clamped/snapped) value, so commit that rather than the pre-validation input.
      if (changed) {
        onValueCommitted(lastChangedValueRef.current, commitDetails);
      }
    },
    onPaste(event) {
      if (event.defaultPrevented || readOnly || disabled) {
        return;
      }
      let pastedData = '';
      try {
        pastedData = event.clipboardData?.getData('text/plain') ?? '';
      } catch {
        /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
        if (process.env.NODE_ENV !== 'production') {
          const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
          (0, _warn.warn)('<NumberField.Input> could not read clipboard text during paste handling.', ownerStackMessage);
        }
        return;
      }

      // Prevent `onChange` from being called.
      event.preventDefault();

      // Insert the pasted text at the caret/selection instead of replacing the entire value,
      // matching native input behavior (e.g. pasting "5" into "123|" yields "1235").
      // The component renders `type="text"`, which always reports a selection range. Overriding
      // `type` with a selection-less one (`email`, `number`) is unsupported either way: the caret
      // restore above throws on those, so there is no working behavior to preserve here.
      const input = event.currentTarget;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      const nextText = inputValue.slice(0, selectionStart) + pastedData + inputValue.slice(selectionEnd);
      const parsedValue = (0, _parse.parseNumber)(nextText, locale, formatOptionsRef.current);
      if (parsedValue !== null) {
        allowInputSyncRef.current = false;
        pendingCaretRef.current = selectionStart + pastedData.length;
        setValue(parsedValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputPaste, event.nativeEvent));
        setInputValue(nextText);
      }
    }
  };
  const element = (0, _useRenderElement.useRenderElement)('input', componentProps, {
    ref: [forwardedRef, inputRef],
    state,
    props: [inputProps, elementProps, props => validation.getValidationProps(disabled, props)],
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NumberFieldInput.displayName = "NumberFieldInput";