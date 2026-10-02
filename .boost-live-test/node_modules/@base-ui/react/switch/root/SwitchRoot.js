"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SwitchRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _useControlled = require("@base-ui/utils/useControlled");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _empty = require("@base-ui/utils/empty");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useButton = require("../../internals/use-button");
var _SwitchRootContext = require("./SwitchRootContext");
var _stateAttributesMapping = require("../stateAttributesMapping");
var _dispatchClickWithModifiers = require("../../utils/dispatchClickWithModifiers");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../../internals/field-register-control/useRegisterFieldControl");
var _FormContext = require("../../internals/form-context/FormContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _useAriaLabelledBy = require("../../internals/labelable-provider/useAriaLabelledBy");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useValueChanged = require("../../internals/useValueChanged");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Represents the switch itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
const SwitchRoot = exports.SwitchRoot = /*#__PURE__*/React.forwardRef(function SwitchRoot(componentProps, forwardedRef) {
  const {
    checked: checkedProp,
    className,
    defaultChecked,
    'aria-labelledby': ariaLabelledByProp,
    form,
    id: idProp,
    inputRef: externalInputRef,
    name: nameProp,
    nativeButton = false,
    onCheckedChange,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render,
    uncheckedValue,
    value,
    style,
    ...elementProps
  } = componentProps;
  const {
    clearErrors
  } = (0, _FormContext.useFormContext)();
  const {
    state: fieldState,
    setTouched,
    setDirty,
    validityData,
    setFilled,
    setFocused,
    validationMode,
    disabled: fieldDisabled,
    name: fieldName,
    validation
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId
  } = (0, _LabelableContext.useLabelableContext)();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const inputRef = React.useRef(null);
  const handleInputRef = (0, _useMergedRefs.useMergedRefs)(inputRef, externalInputRef, validation.inputRef);
  const switchRef = React.useRef(null);
  const id = (0, _useBaseUiId.useBaseUiId)();
  const controlId = (0, _useLabelableId.useLabelableId)({
    id: idProp
  });
  const hiddenInputId = nativeButton ? undefined : controlId;
  const [checked, setCheckedState] = (0, _useControlled.useControlled)({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked'
  });
  (0, _useRegisterFieldControl.useRegisterFieldControl)(switchRef, id, checked, undefined, !disabled, nameProp);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setFilled(checked);
  }, [checked, setFilled]);
  (0, _useValueChanged.useValueChanged)(checked, () => {
    clearErrors(name);
    setDirty(checked !== validityData.initialValue);
    validation.change(checked);
  });
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const ariaLabelledBy = (0, _useAriaLabelledBy.useAriaLabelledBy)(ariaLabelledByProp, labelId, inputRef, !nativeButton, hiddenInputId);
  const rootProps = {
    id: nativeButton ? controlId : id,
    role: 'switch',
    'aria-checked': checked,
    'aria-readonly': readOnly || undefined,
    'aria-required': required || undefined,
    'aria-labelledby': ariaLabelledBy,
    onFocus() {
      if (!disabled) {
        setFocused(true);
      }
    },
    onBlur() {
      const element = inputRef.current;
      if (!element || disabled) {
        return;
      }
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit(element.checked);
      }
    },
    onClick(event) {
      if (readOnly || disabled) {
        return;
      }
      event.preventDefault();
      const input = inputRef.current;
      if (!input) {
        return;
      }
      (0, _dispatchClickWithModifiers.dispatchClickWithModifiers)(input, event);
    }
  };
  const inputProps = {
    ...validation.getValidationProps(disabled),
    checked,
    disabled,
    form,
    id: hiddenInputId,
    name,
    required,
    style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden,
    tabIndex: -1,
    type: 'checkbox',
    'aria-hidden': true,
    ref: handleInputRef,
    onChange(event) {
      // Workaround for https://github.com/react/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }
      if (readOnly) {
        event.preventDefault();
        return;
      }
      const nextChecked = event.currentTarget.checked;
      const eventDetails = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);
      onCheckedChange?.(nextChecked, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      setCheckedState(nextChecked);
    },
    onClick(event) {
      // The click dispatched from the root's `onClick` is an implementation detail
      // and must not reach ancestors, which already receive the original click.
      event.stopPropagation();
    },
    onFocus() {
      switchRef.current?.focus();
    },
    // React <19 sets an empty value if `undefined` is passed explicitly
    // To avoid this, we only set the value if it's defined
    ...(value !== undefined ? {
      value
    } : _empty.EMPTY_OBJECT)
  };
  const state = React.useMemo(() => ({
    ...fieldState,
    checked,
    disabled,
    readOnly,
    required
  }), [fieldState, checked, disabled, readOnly, required]);
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: [forwardedRef, switchRef, buttonRef],
    props: [rootProps, elementProps, getButtonProps, props => validation.getValidationProps(disabled, props)],
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_SwitchRootContext.SwitchRootContext.Provider, {
    value: state,
    children: [element, !checked && name && uncheckedValue !== undefined && /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      type: "hidden",
      form: form,
      name: name,
      value: uncheckedValue,
      disabled: disabled
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ...inputProps,
      suppressHydrationWarning: true
    })]
  });
});
if (process.env.NODE_ENV !== "production") SwitchRoot.displayName = "SwitchRoot";