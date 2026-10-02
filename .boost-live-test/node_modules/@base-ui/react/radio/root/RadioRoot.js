"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _empty = require("@base-ui/utils/empty");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _noop = require("../../internals/noop");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _dispatchClickWithModifiers = require("../../utils/dispatchClickWithModifiers");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useRenderElement = require("../../internals/useRenderElement");
var _useButton = require("../../internals/use-button");
var _constants = require("../../internals/composite/constants");
var _CompositeItem = require("../../internals/composite/item/CompositeItem");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _FieldItemContext = require("../../field/item/FieldItemContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _useAriaLabelledBy = require("../../internals/labelable-provider/useAriaLabelledBy");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _RadioGroupContext = require("../../radio-group/RadioGroupContext");
var _serializeValue = require("../../internals/serializeValue");
var _RadioRootContext = require("./RadioRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Represents the radio button itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
const RadioRoot = exports.RadioRoot = /*#__PURE__*/React.forwardRef(function RadioRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    readOnly: readOnlyProp = false,
    required: requiredProp = false,
    'aria-labelledby': ariaLabelledByProp,
    value,
    inputRef: inputRefProp,
    nativeButton = false,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;
  const groupContext = (0, _RadioGroupContext.useRadioGroupContext)();
  const {
    disabled: disabledGroup,
    readOnly: readOnlyGroup,
    required: requiredGroup,
    form: formGroup,
    checkedValue,
    touched = false,
    validation,
    name,
    setCheckedValue = _noop.NOOP,
    setTouched = _noop.NOOP,
    registerInputRef = _noop.NOOP
  } = groupContext ?? {};
  const {
    setTouched: setFieldTouched,
    setFilled,
    state: fieldState,
    disabled: fieldDisabled
  } = (0, _FieldRootContext.useFieldRootContext)();
  const fieldItemContext = (0, _FieldItemContext.useFieldItemContext)();
  const {
    labelId,
    getDescriptionProps
  } = (0, _LabelableContext.useLabelableContext)();
  const disabled = fieldDisabled || fieldItemContext.disabled || disabledGroup || disabledProp;
  const readOnly = readOnlyGroup || readOnlyProp;
  const required = requiredGroup || requiredProp;
  const form = formGroup;
  const checked = groupContext ? checkedValue === value : value === '';
  const radioRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const registerFieldInput = validation?.registerInput;
  const registerInput = React.useCallback(element => registerFieldInput?.(element, {
    controlRef: radioRef,
    value: undefined
  }), [registerFieldInput]);
  const mergedInputRef = (0, _useMergedRefs.useMergedRefs)(inputRefProp, inputRef, registerInputRef, registerInput);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (inputRef.current?.checked) {
      setFilled(true);
    }
  }, [setFilled]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!inputRef.current) {
      return;
    }
    if (disabled && checked) {
      registerInputRef(null);
      return;
    }
    registerInputRef(inputRef.current);
  }, [checked, disabled, registerInputRef]);
  const id = (0, _useBaseUiId.useBaseUiId)();
  const inputId = (0, _useLabelableId.useLabelableId)({
    id: idProp
  });
  const hiddenInputId = nativeButton ? undefined : inputId;
  const ariaLabelledBy = (0, _useAriaLabelledBy.useAriaLabelledBy)(ariaLabelledByProp, labelId, inputRef, !nativeButton, hiddenInputId);
  const rootProps = {
    role: 'radio',
    'aria-checked': checked,
    'aria-labelledby': ariaLabelledBy,
    [_constants.ACTIVE_COMPOSITE_ITEM]: checked ? '' : undefined,
    id: nativeButton ? inputId : id,
    onKeyDown(event) {
      if (event.key === 'Enter') {
        // Radio only activates with Space. Preventing the keydown's default
        // stops useButton from turning Enter into a click.
        event.preventDefault();
      }
    },
    onClick(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }
      event.preventDefault();
      const input = inputRef.current;
      if (!input) {
        return;
      }
      (0, _dispatchClickWithModifiers.dispatchClickWithModifiers)(input, event);
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled || readOnly || !touched) {
        return;
      }
      inputRef.current?.click();
      setTouched(false);
    }
  };
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton,
    composite: false
  });
  const inputProps = {
    type: 'radio',
    ref: mergedInputRef,
    form,
    id: hiddenInputId,
    name,
    tabIndex: -1,
    style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden,
    'aria-hidden': true,
    ...(value !== undefined ? {
      value: (0, _serializeValue.serializeValue)(value)
    } : _empty.EMPTY_OBJECT),
    disabled,
    checked,
    required,
    readOnly,
    onChange(event) {
      // Workaround for https://github.com/react/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }
      if (disabled || readOnly || value === undefined) {
        return;
      }
      const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);
      setCheckedValue(value, details);
      if (details.isCanceled) {
        return;
      }
      setFieldTouched(true);
    },
    onClick(event) {
      // Clicks dispatched on the input from the root's `onClick` and `onFocus` are an
      // implementation detail and must not reach ancestors.
      event.stopPropagation();
    },
    onFocus() {
      radioRef.current?.focus();
    }
  };
  const state = React.useMemo(() => ({
    ...fieldState,
    required,
    disabled,
    readOnly,
    checked
  }), [fieldState, disabled, readOnly, checked, required]);
  const contextValue = state;
  const isRadioGroup = groupContext !== undefined;
  const refs = [forwardedRef, radioRef, buttonRef];
  const props = [rootProps, elementProps, getButtonProps, getDescriptionProps, validation ? validationProps => validation.getValidationProps(disabled, validationProps) : _empty.EMPTY_OBJECT];
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    enabled: !isRadioGroup,
    state,
    ref: refs,
    props,
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_RadioRootContext.RadioRootContext.Provider, {
    value: contextValue,
    children: [isRadioGroup ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
      tag: "span",
      render: render,
      className: className,
      style: style,
      state: state,
      refs: refs,
      props: props,
      stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
    }) : element, /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ...inputProps,
      suppressHydrationWarning: true
    })]
  });
});
if (process.env.NODE_ENV !== "production") RadioRoot.displayName = "RadioRoot";