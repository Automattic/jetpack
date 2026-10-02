"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PARENT_CHECKBOX = exports.CheckboxRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _empty = require("@base-ui/utils/empty");
var _useControlled = require("@base-ui/utils/useControlled");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _owner = require("@base-ui/utils/owner");
var _getDefaultFormSubmitter = require("@base-ui/utils/getDefaultFormSubmitter");
var _getCheckboxStateAttributesMapping = require("../utils/getCheckboxStateAttributesMapping");
var _dispatchClickWithModifiers = require("../../utils/dispatchClickWithModifiers");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _mergeProps = require("../../merge-props");
var _useButton = require("../../internals/use-button/useButton");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _useRegisterFieldControl = require("../../internals/field-register-control/useRegisterFieldControl");
var _FieldItemContext = require("../../field/item/FieldItemContext");
var _FormContext = require("../../internals/form-context/FormContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _useAriaLabelledBy = require("../../internals/labelable-provider/useAriaLabelledBy");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _CheckboxGroupContext = require("../../checkbox-group/CheckboxGroupContext");
var _CheckboxRootContext = require("./CheckboxRootContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useValueChanged = require("../../internals/useValueChanged");
var _jsxRuntime = require("react/jsx-runtime");
const PARENT_CHECKBOX = exports.PARENT_CHECKBOX = 'data-parent';

/**
 * Represents the checkbox itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
const CheckboxRoot = exports.CheckboxRoot = /*#__PURE__*/React.forwardRef(function CheckboxRoot(componentProps, forwardedRef) {
  const {
    checked: checkedProp,
    className,
    defaultChecked = false,
    'aria-labelledby': ariaLabelledByProp,
    disabled: disabledProp = false,
    form,
    id: idProp,
    indeterminate = false,
    inputRef: inputRefProp,
    name: nameProp,
    onCheckedChange,
    parent = false,
    readOnly = false,
    render,
    required = false,
    uncheckedValue,
    value: valueProp,
    nativeButton = false,
    style,
    ...elementProps
  } = componentProps;
  const {
    clearErrors
  } = (0, _FormContext.useFormContext)();
  const {
    disabled: rootDisabled,
    name: fieldName,
    setDirty,
    setFilled,
    setFocused,
    setTouched,
    state: fieldState,
    validationMode,
    validityData,
    validation: localValidation
  } = (0, _FieldRootContext.useFieldRootContext)();
  const fieldItemContext = (0, _FieldItemContext.useFieldItemContext)();
  const {
    labelId,
    registerControlId,
    getDescriptionProps
  } = (0, _LabelableContext.useLabelableContext)();
  const groupContext = (0, _CheckboxGroupContext.useCheckboxGroupContext)();
  const parentContext = groupContext?.allValues === undefined ? undefined : groupContext.parent;
  const isGroupedWithParent = parentContext !== undefined;
  const disabled = rootDisabled || fieldItemContext.disabled || groupContext?.disabled || disabledProp;
  const name = fieldName ?? nameProp;
  const value = valueProp ?? name;
  const id = (0, _useBaseUiId.useBaseUiId)();

  // A `CheckboxGroup` is the field's control and takes its name from `aria-labelledby`, so the
  // checkboxes sharing its labelable scope must not claim the field's control id: they would all
  // render that one id and collide. A `Field.Item` opens a scope the checkbox does own.
  const ownsControlId = groupContext?.registerControlId !== registerControlId;

  // `|| undefined` rather than `??`: an empty `id` falls back to the scope's control id.
  const controlId = (0, _useLabelableId.useLabelableId)({
    id: idProp || undefined,
    enabled: ownsControlId
  });
  const rootId = nativeButton ? controlId : id;
  let groupProps = {};
  if (isGroupedWithParent) {
    if (parent) {
      groupProps = parentContext.getParentProps();
    } else if (value !== undefined) {
      groupProps = parentContext.getChildProps(value);
    }
  }
  const {
    checked: groupChecked = checkedProp,
    indeterminate: groupIndeterminate = indeterminate,
    onCheckedChange: groupOnChange,
    ...otherGroupProps
  } = groupProps;
  const groupValue = groupContext?.value;
  const controlRef = React.useRef(null);
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const validation = groupContext?.validation ?? localValidation;
  const [checked, setCheckedState] = (0, _useControlled.useControlled)({
    controlled: value !== undefined && groupValue !== undefined && !parent ? groupValue.includes(value) : groupChecked,
    default: defaultChecked,
    name: 'Checkbox',
    state: 'checked'
  });
  const computedChecked = isGroupedWithParent ? Boolean(groupChecked) : checked;
  const computedIndeterminate = isGroupedWithParent ? groupIndeterminate || indeterminate : indeterminate;
  (0, _useRegisterFieldControl.useRegisterFieldControl)(controlRef, id, checked, undefined, !groupContext && !disabled, nameProp);
  const registerChildId = parentContext?.registerChildId;
  const inputRef = React.useRef(null);
  const registerFieldInput = validation.registerInput;
  const registeredInputValue = groupContext ? value : undefined;
  const registerInput = React.useCallback(element => registerFieldInput(element, {
    controlRef,
    value: registeredInputValue
  }), [registerFieldInput, registeredInputValue]);
  const mergedInputRef = (0, _useMergedRefs.useMergedRefs)(inputRefProp, inputRef, parent ? undefined : registerInput);
  const ariaLabelledBy = (0, _useAriaLabelledBy.useAriaLabelledBy)(ariaLabelledByProp, labelId, inputRef, !nativeButton, controlId);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (inputRef.current) {
      // Re-assert on `checked` changes too: clicking the input natively resets `indeterminate`.
      inputRef.current.indeterminate = computedIndeterminate;
    }
    // Inside a group, the group derives the filled state from its value.
    if (!groupContext) {
      setFilled(checked);
    }
  }, [checked, computedIndeterminate, groupContext, setFilled]);
  (0, _useValueChanged.useValueChanged)(checked, () => {
    if (groupContext) {
      return;
    }
    clearErrors(name);
    setDirty(checked !== validityData.initialValue);
    validation.change(checked);
  });
  const inputProps = (0, _mergeProps.mergeProps)({
    checked,
    disabled,
    form,
    // parent checkboxes unset `name` to be excluded from form submission
    name: parent ? undefined : name,
    // Set `id` to stop Chrome warning about an unassociated input.
    // When using a native button, the `id` is applied to the button instead.
    id: nativeButton ? undefined : controlId,
    required,
    ref: mergedInputRef,
    style: name ? _visuallyHidden.visuallyHiddenInput : _visuallyHidden.visuallyHidden,
    tabIndex: -1,
    type: 'checkbox',
    'aria-hidden': true,
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
      const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);
      onCheckedChange?.(nextChecked, details);
      if (details.isCanceled) {
        return;
      }
      groupOnChange?.(nextChecked, details);
      if (details.isCanceled) {
        return;
      }
      setCheckedState(nextChecked);
      if (value !== undefined && groupContext !== undefined && !parent && !isGroupedWithParent) {
        const nextGroupValue = nextChecked ? [...groupContext.value, value] : groupContext.value.filter(item => item !== value);
        groupContext.setValue(nextGroupValue, details);
      }
    },
    onClick(event) {
      // The click dispatched from the root's `onClick` is an implementation detail
      // and must not reach ancestors, which already receive the original click.
      event.stopPropagation();
    },
    onFocus() {
      controlRef.current?.focus();
    }
  },
  // React <19 sets an empty value if `undefined` is passed explicitly
  // To avoid this, we only set the value if it's defined
  valueProp !== undefined ? {
    value: (groupContext ? checked && valueProp : valueProp) || ''
  } : _empty.EMPTY_OBJECT, getDescriptionProps, props => validation.getValidationProps(disabled, props));
  React.useEffect(() => {
    if (!parentContext || value === undefined) {
      return undefined;
    }
    const disabledStates = parentContext.disabledStatesRef.current;
    disabledStates.set(value, disabled);
    return () => {
      disabledStates.delete(value);
    };
  }, [parentContext, disabled, value]);
  const state = React.useMemo(() => ({
    ...fieldState,
    checked: computedChecked,
    disabled,
    readOnly,
    required,
    indeterminate: computedIndeterminate
  }), [fieldState, computedChecked, disabled, readOnly, required, computedIndeterminate]);
  const stateAttributesMapping = (0, _getCheckboxStateAttributesMapping.getCheckboxStateAttributesMapping)(state);
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: [buttonRef, controlRef, forwardedRef],
    props: [{
      id: rootId,
      role: 'checkbox',
      'aria-checked': computedIndeterminate ? 'mixed' : computedChecked,
      'aria-readonly': readOnly || undefined,
      'aria-required': required || undefined,
      'aria-labelledby': ariaLabelledBy,
      [PARENT_CHECKBOX]: parent ? '' : undefined,
      onFocus() {
        if (!disabled) {
          setFocused(true);
        }
      },
      onBlur() {
        const inputEl = inputRef.current;
        if (!inputEl) {
          return;
        }
        setTouched(true);
        setFocused(false);
        if (validationMode === 'onBlur') {
          validation.commit(groupContext ? groupValue : inputEl.checked);
        }
      },
      onKeyDown(event) {
        if (event.key !== 'Enter') {
          return;
        }

        // Let consumer `preventDefault()` handlers opt out while defensively stopping
        // any remaining Base UI Enter handling from treating the checkbox as a button.
        event.preventBaseUIHandler();
        if (event.defaultPrevented) {
          return;
        }
        const formToSubmit = inputRef.current?.form ?? null;
        const currentTarget = event.currentTarget;
        const nativeEvent = event.nativeEvent;
        const originalPreventDefault = event.preventDefault;
        const originalNativePreventDefault = nativeEvent.preventDefault;
        let preventDefaultCalledAfterPropagation = false;
        event.preventDefault = () => {
          preventDefaultCalledAfterPropagation = true;
          originalPreventDefault.call(event);
        };
        nativeEvent.preventDefault = () => {
          preventDefaultCalledAfterPropagation = true;
          originalNativePreventDefault.call(nativeEvent);
        };

        // Enter should not activate/toggle the checkbox. Cancel the native button behavior
        // without setting React's synthetic `defaultPrevented`, so ancestor React handlers
        // can still opt out by calling `preventDefault()` during propagation.
        originalNativePreventDefault.call(nativeEvent);
        (0, _owner.ownerWindow)(currentTarget).queueMicrotask(() => {
          event.preventDefault = originalPreventDefault;
          nativeEvent.preventDefault = originalNativePreventDefault;
          if (!preventDefaultCalledAfterPropagation) {
            (0, _getDefaultFormSubmitter.getDefaultFormSubmitter)(formToSubmit)?.click();
          }
        });
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
    }, elementProps, otherGroupProps, getButtonProps, getDescriptionProps, props => validation.getValidationProps(disabled, props)],
    stateAttributesMapping
  });

  // `useRenderElement` always returns an element here, so the cast only narrows `props`.
  const renderedId = element.props.id;
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!registerChildId || parent || value === undefined || renderedId === undefined) {
      return undefined;
    }
    return registerChildId(value, renderedId);
  }, [registerChildId, parent, value, renderedId]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_CheckboxRootContext.CheckboxRootContext.Provider, {
    value: state,
    children: [element, !checked && !groupContext && name && !parent && uncheckedValue !== undefined && /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
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
if (process.env.NODE_ENV !== "production") CheckboxRoot.displayName = "CheckboxRoot";