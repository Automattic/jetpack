"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastAction = void 0;
var React = _interopRequireWildcard(require("react"));
var _ToastRootContext = require("../root/ToastRootContext");
var _useButton = require("../../internals/use-button/useButton");
var _useRenderElement = require("../../internals/useRenderElement");
var _isRenderableNode = require("../utils/isRenderableNode");
/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastAction = exports.ToastAction = /*#__PURE__*/React.forwardRef(function ToastAction(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const {
    toast
  } = (0, _ToastRootContext.useToastRootContext)();
  const computedChildren = toast.actionProps?.children ?? elementProps.children;
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const state = {
    type: toast.type
  };
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [elementProps, toast.actionProps, getButtonProps, {
      children: computedChildren
    }]
  });
  return (0, _isRenderableNode.hasRenderableChildren)(element) ? element : null;
});
if (process.env.NODE_ENV !== "production") ToastAction.displayName = "ToastAction";