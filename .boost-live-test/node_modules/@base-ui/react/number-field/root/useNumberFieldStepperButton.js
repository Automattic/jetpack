"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useNumberFieldStepperButton = useNumberFieldStepperButton;
var _useRenderElement = require("../../internals/useRenderElement");
var _useButton = require("../../internals/use-button");
var _usePressAndHold = require("../../internals/usePressAndHold");
var _parse = require("../utils/parse");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _NumberFieldRootContext = require("./NumberFieldRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
const SELECT_NONE_STYLE = {
  WebkitUserSelect: 'none',
  userSelect: 'none'
};
/**
 * Shared implementation for the increment and decrement stepper buttons. They differ only in the
 * direction they step and the boundary (`max` vs `min`) at which they become disabled.
 */
function useNumberFieldStepperButton(componentProps, forwardedRef, isIncrement) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    allowInputSyncRef,
    formatOptionsRef,
    getStepAmount,
    id,
    incrementValue,
    inputRef,
    focusInput,
    maxWithDefault,
    minWithDefault,
    setValue,
    state,
    valueRef,
    locale,
    lastChangedValueRef,
    onValueCommitted
  } = (0, _NumberFieldRootContext.useNumberFieldRootContext)();
  const {
    disabled: contextDisabled,
    readOnly,
    value,
    inputValue
  } = state;
  const isAtBoundary = value != null && (isIncrement ? value >= maxWithDefault : value <= minWithDefault);
  const disabled = disabledProp || contextDisabled || isAtBoundary;
  const pressReason = isIncrement ? _reasons.REASONS.incrementPress : _reasons.REASONS.decrementPress;
  function commitValue(nativeEvent) {
    const shouldCommitInputValue = !allowInputSyncRef.current;
    allowInputSyncRef.current = true;
    if (!shouldCommitInputValue) {
      // The input is already synced, so step from the authoritative numeric value rather than
      // re-parsing the rounded display text. Refresh the commit ref to the current value so a
      // subsequent canceled step can't commit a stale `lastChangedValueRef` left over from an
      // earlier change (the `setValue` that used to refresh it is now skipped on this path).
      lastChangedValueRef.current = valueRef.current;
      return;
    }

    // The input is dirty but not yet blurred, so the value won't have been committed.
    const parsedValue = (0, _parse.parseNumber)(inputValue, locale, formatOptionsRef.current);
    if (parsedValue !== null) {
      // Sync the dirty typed value with no direction so it isn't directionally snapped
      // (`snapOnStep`) before the real increment/decrement runs, which would otherwise emit a
      // spurious intermediate value.
      const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(pressReason, nativeEvent);
      setValue(parsedValue, details);

      // Only sync the ref base when the commit wasn't canceled, so a subsequent increment in the
      // same interaction steps from the value actually applied.
      if (!details.isCanceled) {
        valueRef.current = parsedValue;
      }
    }
  }
  const {
    pointerHandlers,
    shouldSkipClick
  } = (0, _usePressAndHold.usePressAndHold)({
    disabled: disabled || readOnly,
    elementRef: inputRef,
    tick(triggerEvent) {
      const amount = getStepAmount(triggerEvent);
      return incrementValue(amount, {
        direction: isIncrement ? 1 : -1,
        event: triggerEvent,
        reason: pressReason
      });
    },
    onStop(nativeEvent) {
      // `onStop` fires on every release; fall back to the current value when no tick changed it.
      // Step interactions never commit `null`, so the `??` can't mask a legitimate null commit.
      const committed = lastChangedValueRef.current ?? valueRef.current;
      onValueCommitted(committed, (0, _createBaseUIEventDetails.createGenericEventDetails)(pressReason, nativeEvent));
    }
  });
  const props = {
    disabled,
    'aria-label': isIncrement ? 'Increase' : 'Decrease',
    'aria-controls': id,
    // Keyboard users shouldn't have access to the buttons, since they can use the input element
    // to change the value. On the other hand, `aria-hidden` is not applied because touch screen
    // readers should be able to use the buttons.
    tabIndex: -1,
    style: SELECT_NONE_STYLE,
    ...pointerHandlers,
    onClick(event) {
      const isDisabled = disabled || readOnly;
      if (event.defaultPrevented || isDisabled || shouldSkipClick(event)) {
        return;
      }
      commitValue(event.nativeEvent);
      const amount = getStepAmount(event);
      const prev = valueRef.current;
      incrementValue(amount, {
        direction: isIncrement ? 1 : -1,
        event: event.nativeEvent,
        reason: pressReason
      });
      const committed = lastChangedValueRef.current ?? valueRef.current;
      if (committed !== prev) {
        onValueCommitted(committed, (0, _createBaseUIEventDetails.createGenericEventDetails)(pressReason, event.nativeEvent));
      }
    },
    onPointerDown(event) {
      if (event.defaultPrevented || readOnly || event.button || disabled) {
        return;
      }

      // Sync dirty input value before starting the hold sequence.
      commitValue(event.nativeEvent);
      // Treat `lastChangedValueRef` as a per-hold result slot. If the first tick is a no-op or is
      // canceled, `onStop` should fall back to the current value, not a previous interaction.
      lastChangedValueRef.current = null;
      if (!(0, _usePressAndHold.isTouchLikePointerType)(event.pointerType)) {
        // Focus the input so the user can continue with keyboard interactions.
        focusInput();
      }
      pointerHandlers.onPointerDown(event);
    }
  };
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    // Read-only steppers are exposed as unavailable through button disabled semantics, while
    // `data-readonly` (from `state`) is preserved for styling. `aria-readonly` isn't valid on the
    // `button` role, so it's intentionally not set.
    disabled: disabled || readOnly,
    native: nativeButton,
    focusableWhenDisabled: true
  });
  const buttonState = {
    ...state,
    disabled
  };
  return (0, _useRenderElement.useRenderElement)('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state: buttonState,
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
}