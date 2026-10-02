"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToggleGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useControlled = require("@base-ui/utils/useControlled");
var _empty = require("@base-ui/utils/empty");
var _useRenderElement = require("../internals/useRenderElement");
var _CompositeRoot = require("../internals/composite/root/CompositeRoot");
var _ToolbarRootContext = require("../toolbar/root/ToolbarRootContext");
var _ToolbarGroupContext = require("../toolbar/group/ToolbarGroupContext");
var _ToggleGroupContext = require("./ToggleGroupContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Provides a shared state to a series of toggle buttons.
 *
 * Documentation: [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group)
 */
const ToggleGroup = exports.ToggleGroup = /*#__PURE__*/React.forwardRef(function ToggleGroup(componentProps, forwardedRef) {
  const {
    defaultValue: defaultValueProp,
    disabled: disabledProp = false,
    loopFocus = true,
    onValueChange,
    orientation = 'horizontal',
    multiple = false,
    value: valueProp,
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const toolbarContext = (0, _ToolbarRootContext.useToolbarRootContext)(true);
  const toolbarGroupContext = (0, _ToolbarGroupContext.useToolbarGroupContext)();
  const defaultValue = defaultValueProp ?? _empty.EMPTY_ARRAY;
  // Use the raw prop to distinguish an omitted value from the empty default.
  const isValueInitialized = valueProp !== undefined || defaultValueProp !== undefined;
  const disabled = (toolbarContext?.disabled ?? false) || (toolbarGroupContext?.disabled ?? false) || disabledProp;
  const [groupValue, setValueState] = (0, _useControlled.useControlled)({
    controlled: valueProp,
    default: defaultValue,
    name: 'ToggleGroup',
    state: 'value'
  });
  const setGroupValue = (0, _useStableCallback.useStableCallback)((newValue, nextPressed, eventDetails) => {
    let newGroupValue;
    if (multiple) {
      newGroupValue = groupValue.slice();
      if (nextPressed) {
        newGroupValue.push(newValue);
      } else {
        newGroupValue.splice(groupValue.indexOf(newValue), 1);
      }
    } else {
      newGroupValue = nextPressed ? [newValue] : [];
    }
    onValueChange?.(newGroupValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueState(newGroupValue);
  });
  const state = {
    disabled,
    multiple,
    orientation
  };
  const contextValue = React.useMemo(() => ({
    disabled,
    setGroupValue,
    value: groupValue,
    isValueInitialized
  }), [disabled, setGroupValue, groupValue, isValueInitialized]);
  const defaultProps = {
    role: 'group'
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    enabled: Boolean(toolbarContext),
    state,
    ref: forwardedRef,
    props: [defaultProps, elementProps]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ToggleGroupContext.ToggleGroupContext.Provider, {
    value: contextValue,
    children: toolbarContext ? element : /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef],
      props: [defaultProps, elementProps],
      loopFocus: loopFocus,
      enableHomeAndEndKeys: true,
      orientation: orientation
    })
  });
});
if (process.env.NODE_ENV !== "production") ToggleGroup.displayName = "ToggleGroup";