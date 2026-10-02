"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Toggle = void 0;
var React = _interopRequireWildcard(require("react"));
var _useControlled = require("@base-ui/utils/useControlled");
var _error = require("@base-ui/utils/error");
var _useBaseUiId = require("../internals/useBaseUiId");
var _useRenderElement = require("../internals/useRenderElement");
var _ToggleGroupContext = require("../toggle-group/ToggleGroupContext");
var _useButton = require("../internals/use-button/useButton");
var _CompositeItem = require("../internals/composite/item/CompositeItem");
var _createBaseUIEventDetails = require("../internals/createBaseUIEventDetails");
var _reasons = require("../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
const Toggle = exports.Toggle = /*#__PURE__*/React.forwardRef(function Toggle(componentProps, forwardedRef) {
  const {
    className,
    defaultPressed = false,
    disabled: disabledProp = false,
    form,
    // never participates in form validation
    onPressedChange,
    pressed: pressedProp,
    render,
    type,
    // cannot change button type
    value: valueProp,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  // `|| undefined` handles cases, where value is falsy (i.e. "")
  const value = (0, _useBaseUiId.useBaseUiId)(valueProp || undefined);
  const groupContext = (0, _ToggleGroupContext.useToggleGroupContext)();
  const groupValue = groupContext?.value ?? [];
  const disabled = (disabledProp || groupContext?.disabled) ?? false;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (groupContext && valueProp === undefined && groupContext.isValueInitialized) {
        (0, _error.error)('A `<Toggle>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.', 'This will cause issues between the Toggle Group and Toggle values.', 'Provide the `<Toggle>` with a `value` prop matching the `<ToggleGroup>` values prop type.');
      }
    }, [groupContext, valueProp, groupContext?.isValueInitialized]);
  }
  const [pressed, setPressedState] = (0, _useControlled.useControlled)({
    controlled: groupContext ? value !== undefined && groupValue.indexOf(value) > -1 : pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed'
  });
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const state = {
    disabled,
    pressed
  };
  const refs = [buttonRef, forwardedRef];
  const props = [{
    'aria-pressed': pressed,
    onClick(event) {
      const nextPressed = !pressed;
      const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent);

      // `onPressedChange` runs before the group commits so that canceling here
      // can also veto the group value change, which shares this `details` object.
      onPressedChange?.(nextPressed, details);
      if (details.isCanceled) {
        return;
      }
      if (value) {
        groupContext?.setGroupValue?.(value, nextPressed, details);
      }
      if (details.isCanceled) {
        return;
      }
      setPressedState(nextPressed);
    }
  }, elementProps, getButtonProps];
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    enabled: !groupContext,
    state,
    ref: refs,
    props
  });

  // A disabled toggle is natively disabled and cannot hold roving focus.
  // Toolbar reads this metadata to compute its `disabledIndices`.
  const itemMetadata = React.useMemo(() => ({
    disabled,
    focusableWhenDisabled: false
  }), [disabled]);
  if (groupContext) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
      tag: "button",
      render: render,
      className: className,
      style: style,
      metadata: itemMetadata,
      state: state,
      refs: refs,
      props: props
    });
  }
  return element;
});
if (process.env.NODE_ENV !== "production") Toggle.displayName = "Toggle";