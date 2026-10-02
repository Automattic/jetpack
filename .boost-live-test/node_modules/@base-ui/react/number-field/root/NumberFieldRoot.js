"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _useControlled = require("@base-ui/utils/useControlled");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _useForcedRerendering = require("@base-ui/utils/useForcedRerendering");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _owner = require("@base-ui/utils/owner");
var _platform = require("@base-ui/utils/platform");
var _formatNumber = require("@base-ui/utils/formatNumber");
var _utils = require("../../floating-ui-react/utils");
var _NumberFieldRootContext = require("./NumberFieldRootContext");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _FormContext = require("../../internals/form-context/FormContext");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _parse = require("../utils/parse");
var _validate = require("../utils/validate");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of the number field and manages its state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldRoot = exports.NumberFieldRoot = /*#__PURE__*/React.forwardRef(function NumberFieldRoot(componentProps, forwardedRef) {
  const {
    id: idProp,
    min,
    max,
    smallStep = 0.1,
    step: stepProp = 1,
    largeStep = 10,
    required = false,
    disabled: disabledProp = false,
    readOnly = false,
    form,
    name: nameProp,
    defaultValue = null,
    value: valueProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
    allowWheelScrub = false,
    snapOnStep = false,
    allowOutOfRange = false,
    format,
    locale,
    render,
    className,
    inputRef: inputRefProp,
    style,
    ...elementProps
  } = componentProps;
  const {
    setDirty,
    validityData,
    disabled: fieldDisabled,
    setFilled,
    name: fieldName,
    state: fieldState,
    validation
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    clearErrors
  } = (0, _FormContext.useFormContext)();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const step = stepProp === 'any' ? 1 : stepProp;
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = min ?? 0;
  const formatStyle = format?.style;
  const inputRef = React.useRef(null);
  const hiddenInputRef = (0, _useMergedRefs.useMergedRefs)(inputRefProp, validation.inputRef);
  const id = (0, _useLabelableId.useLabelableId)({
    id: idProp
  });
  const [value, setValueUnwrapped] = (0, _useControlled.useControlled)({
    controlled: valueProp,
    default: defaultValue,
    name: 'NumberField',
    state: 'value'
  });
  const valueRef = (0, _useValueAsRef.useValueAsRef)(value);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setFilled(value !== null);
  }, [setFilled, value]);
  const forceRender = (0, _useForcedRerendering.useForcedRerendering)();
  const formatOptionsRef = (0, _useValueAsRef.useValueAsRef)(format);
  const hasPendingCommitRef = React.useRef(false);
  const onValueCommitted = (0, _useStableCallback.useStableCallback)((nextValue, eventDetails) => {
    hasPendingCommitRef.current = false;
    onValueCommittedProp?.(nextValue, eventDetails);
  });
  const allowInputSyncRef = React.useRef(true);
  const lastChangedValueRef = React.useRef(null);

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  const [inputValue, setInputValue] = React.useState(() => (0, _formatNumber.formatNumber)(value, locale, format));
  const [inputMode, setInputMode] = React.useState('numeric');
  const getAllowedNonNumericKeys = (0, _useStableCallback.useStableCallback)(() => {
    const parts = (0, _parse.getFormatParts)(locale, format);
    const keys = new Set(_parse.BASE_NON_NUMERIC_SYMBOLS);
    const addAll = chars => chars.forEach(char => keys.add(char));

    // Integer formats omit the decimal from `parts`, so fall back to the locale's separator in that
    // case; it must stay typeable regardless of whether the format renders a fraction.
    const decimal = parts.find(part => part.type === 'decimal')?.value ?? (0, _parse.getNumberLocaleDetails)(locale, format).decimal;
    keys.add(decimal);

    // Allow every non-digit character the formatter renders — separators, currency symbols, units
    // (e.g. `km/h`, `°C`), exponent separators, and locale literals — decomposed per character
    // because the input validates the typed string one character at a time. Deriving these from
    // the formatter covers multi-character and locale-specific symbols of every part type
    // uniformly. `compact` suffixes (e.g. `K`/`M`) are excluded because `parseNumber` can't reverse
    // them, so allowing them would yield a silently incorrect value.
    parts.forEach(part => {
      if (part.type === 'integer' || part.type === 'fraction' || part.type === 'exponentInteger' || part.type === 'compact') {
        return;
      }
      addAll(Array.from(part.value));
      if (_parse.SPACE_SEPARATOR_RE.test(part.value)) {
        keys.add(' ');
      }
    });
    const allowPercentSymbols = formatStyle === 'percent' || formatStyle === 'unit' && format?.unit === 'percent';
    const allowPermilleSymbols = formatStyle === 'percent' || formatStyle === 'unit' && format?.unit === 'permille';

    // Tolerate percent/permille variants the formatter doesn't emit but users may type or paste.
    if (allowPercentSymbols) {
      addAll(_parse.PERCENTAGES);
    }
    if (allowPermilleSymbols) {
      addAll(_parse.PERMILLE);
    }

    // Allow plus sign in all cases; minus sign when negatives are valid, or when out-of-range
    // entry is allowed so native underflow validation can be triggered from the keyboard.
    addAll(_parse.PLUS_SIGNS_WITH_ASCII);
    if (minWithDefault < 0 || allowOutOfRange) {
      addAll(_parse.MINUS_SIGNS_WITH_ASCII);
    }
    return keys;
  });
  const getStepAmount = (0, _useStableCallback.useStableCallback)(event => {
    if (event?.altKey) {
      return smallStep;
    }
    if (event?.shiftKey) {
      return largeStep;
    }
    return step;
  });
  const setValue = (0, _useStableCallback.useStableCallback)((unvalidatedValue, details) => {
    const eventWithOptionalKeyState = details.event;
    const dir = details.direction;

    // Direct text entry (typing, pasting, clearing, autofill) behaves natively; step-based
    // interactions (keyboard arrows, buttons, wheel, scrub) do not. All direct-entry reasons
    // (`input-change`, `input-clear`, `input-blur`, `input-paste`) share the `input-` prefix.
    const isInputReason = details.reason.startsWith('input-') || details.reason === _reasons.REASONS.none;

    // Only allow out-of-range values for direct text entry. Step-based interactions still clamp.
    const shouldClampValue = !allowOutOfRange || !isInputReason;
    const validatedValue = (0, _validate.toValidatedNumber)(unvalidatedValue, dir ? getStepAmount(eventWithOptionalKeyState) * dir : undefined, minWithDefault, maxWithDefault, minWithZeroDefault, formatOptionsRef.current, snapOnStep, eventWithOptionalKeyState?.altKey ?? false, shouldClampValue);

    // Notify about a change even when the numeric value is unchanged for input reasons: the
    // typed text may clamp/snap to the current value, or differ while validation normalizes
    // it back to the existing value.
    const shouldFireChange = validatedValue !== value || isInputReason && (unvalidatedValue !== value || allowInputSyncRef.current === false);
    if (shouldFireChange) {
      onValueChangeProp?.(validatedValue, details);
      if (details.isCanceled) {
        // Report a vetoed change as not applied, so callers don't commit a value never stored.
        return false;
      }
      setValueUnwrapped(validatedValue);
      setDirty(validatedValue !== validityData.initialValue);
      hasPendingCommitRef.current = true;
    }
    lastChangedValueRef.current = validatedValue;

    // Keep the visible input in sync immediately when programmatic changes occur
    // (increment/decrement, wheel, etc). During direct typing we don't want
    // to overwrite the user-provided text until blur, so we gate on
    // `allowInputSyncRef`.
    if (allowInputSyncRef.current) {
      setInputValue((0, _formatNumber.formatNumber)(validatedValue, locale, format));
    }

    // Formatting can change even if the numeric value hasn't, so ensure a re-render when needed.
    forceRender();
    return shouldFireChange;
  });
  const incrementValue = (0, _useStableCallback.useStableCallback)((amount, {
    direction,
    currentValue,
    event,
    reason
  }) => {
    const prevValue = currentValue == null ? valueRef.current : currentValue;
    const nativeEvent = event;
    if (typeof prevValue !== 'number') {
      // Seed an empty field with 0; `setValue` clamps it to the in-range value nearest 0
      // (e.g. `max` for a negative range). No `direction`: the seed isn't a step, so it must
      // not be directionally snapped.
      return setValue(0, (0, _createBaseUIEventDetails.createChangeEventDetails)(reason, nativeEvent));
    }
    return setValue(prevValue + amount * direction, (0, _createBaseUIEventDetails.createChangeEventDetails)(reason, nativeEvent, undefined, {
      direction
    }));
  });

  // We need to update the input value when the external `value` prop changes. This ends up acting
  // as a single source of truth to update the input value, bypassing the need to manually set it in
  // each event handler.
  // This is done inside a layout effect as an alternative to the technique to set state during
  // render as we're accessing a ref, which must be inside an effect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  //
  // ESLint is disabled because it needs to run even if the parsed value hasn't changed, since the
  // value still can be formatted differently.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(function syncFormattedInputValueOnValueChange() {
    // This ensures the value is only updated on blur rather than every keystroke, but still
    // allows the input value to be updated when the value is changed externally.
    if (!allowInputSyncRef.current) {
      return;
    }
    const nextInputValue = (0, _formatNumber.formatNumber)(value, locale, format);
    if (nextInputValue !== inputValue) {
      setInputValue(nextInputValue);
    }
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(function setDynamicInputModeForIOS() {
    if (!_platform.platform.os.ios) {
      return;
    }

    // iOS numeric software keyboard doesn't have a minus key, so we need to use the default
    // keyboard to let the user input a negative number.
    let computedInputMode = 'text';
    if (minWithDefault >= 0) {
      // iOS numeric software keyboard doesn't have a decimal key for "numeric" input mode, but
      // this is better than the "text" input if possible to use.
      computedInputMode = 'decimal';
    }
    setInputMode(computedInputMode);
  }, [minWithDefault]);

  // Programmatic focus leaves the caret at the start (Chrome/Firefox) or selects the whole value
  // (Safari). Store the caret at the end before focusing: every engine restores the stored
  // selection on `focus()`, and a selection the consumer sets in `onFocus` still wins. Keyboard
  // and pointer focus keep the browser's native selection behavior.
  const focusInput = (0, _useStableCallback.useStableCallback)(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const length = input.value.length;
    input.setSelectionRange(length, length);
    input.focus();
  });

  // React attaches `onWheel` as a passive listener, so calling `preventDefault` there is ignored.
  // Attach a native (non-passive) `wheel` listener to the input instead to prevent page scrolling.
  React.useEffect(function registerElementWheelListener() {
    const element = inputRef.current;
    if (disabled || readOnly || !allowWheelScrub || !element) {
      return undefined;
    }
    function handleWheel(event) {
      if (
      // Allow pinch-zooming.
      event.ctrlKey || (0, _utils.activeElement)((0, _owner.ownerDocument)(inputRef.current)) !== inputRef.current) {
        return;
      }

      // Some browsers deliver shift + wheel on the horizontal axis, so there the horizontal
      // delta is the intended vertical one. Touchpads emit sub-pixel noise on the cross axis,
      // so compare the axes rather than requiring an exact zero.
      const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = event.shiftKey && isHorizontal ? event.deltaX : event.deltaY;

      // Ignore horizontal gestures so the page can scroll instead of scrubbing. Shift is exempt:
      // its gesture is horizontal wherever the browser swaps the axis.
      if (delta === 0 || !event.shiftKey && isHorizontal) {
        return;
      }

      // Prevent the default behavior to avoid scrolling the page.
      event.preventDefault();
      allowInputSyncRef.current = true;
      const amount = getStepAmount(event);

      // Each wheel turn is a discrete, final change, so commit it immediately like keyboard
      // steps (gated on an actual change so boundary no-ops don't commit).
      const changed = incrementValue(amount, {
        direction: delta > 0 ? -1 : 1,
        event,
        reason: _reasons.REASONS.wheel
      });
      if (changed) {
        onValueCommitted(lastChangedValueRef.current, (0, _createBaseUIEventDetails.createGenericEventDetails)(_reasons.REASONS.wheel, event));
      }
    }
    return (0, _addEventListener.addEventListener)(element, 'wheel', handleWheel);
  }, [allowWheelScrub, incrementValue, disabled, readOnly, getStepAmount, onValueCommitted, lastChangedValueRef, valueRef]);
  const state = React.useMemo(() => ({
    ...fieldState,
    disabled,
    readOnly,
    required,
    value,
    inputValue,
    scrubbing: isScrubbing
  }), [fieldState, disabled, readOnly, required, value, inputValue, isScrubbing]);
  const contextValue = React.useMemo(() => ({
    inputRef,
    focusInput,
    minWithDefault,
    maxWithDefault,
    id,
    setValue,
    incrementValue,
    getStepAmount,
    allowInputSyncRef,
    formatOptionsRef,
    valueRef,
    lastChangedValueRef,
    hasPendingCommitRef,
    name,
    nameProp,
    inputMode,
    getAllowedNonNumericKeys,
    min,
    max,
    setInputValue,
    locale,
    setIsScrubbing,
    state,
    onValueCommitted
  }), [inputRef, focusInput, minWithDefault, maxWithDefault, id, setValue, incrementValue, getStepAmount, formatOptionsRef, valueRef, name, nameProp, inputMode, getAllowedNonNumericKeys, min, max, setInputValue, locale, state, onValueCommitted]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_NumberFieldRootContext.NumberFieldRootContext.Provider, {
    value: contextValue,
    children: [element, /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ...validation.getValidationProps(disabled, {
        onFocus() {
          focusInput();
        },
        onChange(event) {
          // Workaround for https://github.com/react/react/issues/9023
          if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
            return;
          }

          // Handle browser autofill.
          const nextValue = event.currentTarget.valueAsNumber;
          const parsedValue = Number.isNaN(nextValue) ? null : nextValue;
          const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);

          // `setValue` updates the dirty flag from the stored (clamped) value, so validate with
          // that same value rather than the raw autofilled one.
          setValue(parsedValue, details);
          clearErrors(name);
          validation.change(lastChangedValueRef.current ?? parsedValue);
        }
      }),
      ref: hiddenInputRef,
      type: "number",
      form: form,
      name: name,
      value: value ?? '',
      min: min,
      max: max
      // stepMismatch validation is broken unless an explicit `min` is added.
      // See https://github.com/react/react/issues/12334.
      ,
      step: stepProp,
      disabled: disabled,
      readOnly: readOnly,
      required: required,
      "aria-hidden": true,
      tabIndex: -1,
      style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden,
      suppressHydrationWarning: true
    })]
  });
});
if (process.env.NODE_ENV !== "production") NumberFieldRoot.displayName = "NumberFieldRoot"; // `none` is kept for consistency with other components even though the number field never
// commits with it.