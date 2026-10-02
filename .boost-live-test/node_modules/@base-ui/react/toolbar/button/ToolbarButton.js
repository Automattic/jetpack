"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToolbarButton = void 0;
var React = _interopRequireWildcard(require("react"));
var _empty = require("@base-ui/utils/empty");
var _useButton = require("../../internals/use-button");
var _ToolbarRootContext = require("../root/ToolbarRootContext");
var _ToolbarGroupContext = require("../group/ToolbarGroupContext");
var _CompositeItem = require("../../internals/composite/item/CompositeItem");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarButton = exports.ToolbarButton = /*#__PURE__*/React.forwardRef(function ToolbarButton(componentProps, forwardedRef) {
  const {
    className,
    disabled: disabledProp = false,
    focusableWhenDisabled = true,
    render,
    nativeButton,
    style,
    ...elementProps
  } = componentProps;
  const {
    disabled: toolbarDisabled,
    orientation
  } = (0, _ToolbarRootContext.useToolbarRootContext)();
  const groupContext = (0, _ToolbarGroupContext.useToolbarGroupContext)();
  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;
  const itemMetadata = React.useMemo(() => ({
    disabled,
    focusableWhenDisabled
  }), [disabled, focusableWhenDisabled]);
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    focusableWhenDisabled,
    native: nativeButton
  });
  const state = {
    disabled,
    orientation,
    focusable: focusableWhenDisabled
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
    tag: "button",
    render: render,
    className: className,
    style: style,
    metadata: itemMetadata,
    state: state,
    refs: [forwardedRef, buttonRef],
    props: [elementProps,
    // When a render prop is provided (typically another Base UI component
    // like Menu.Trigger), forward `disabled` so the rendered component can
    // derive its own disabled state. For the default toolbar button, avoid
    // forwarding a React `disabled` prop so focusable disabled buttons remain
    // hoverable for interactions like tooltips.
    // TODO: follow up after https://github.com/mui/base-ui/issues/1976#issuecomment-2916905663
    render ? {
      disabled
    } : _empty.EMPTY_OBJECT, getButtonProps]
  });
});
if (process.env.NODE_ENV !== "production") ToolbarButton.displayName = "ToolbarButton";