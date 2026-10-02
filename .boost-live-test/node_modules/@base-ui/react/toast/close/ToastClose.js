"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastClose = void 0;
var React = _interopRequireWildcard(require("react"));
var _ToastRootContext = require("../root/ToastRootContext");
var _ToastProviderContext = require("../provider/ToastProviderContext");
var _useButton = require("../../internals/use-button/useButton");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastClose = exports.ToastClose = /*#__PURE__*/React.forwardRef(function ToastClose(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const store = (0, _ToastProviderContext.useToastProviderContext)();
  const {
    toast,
    expanded
  } = (0, _ToastRootContext.useToastRootContext)();
  const [hasFocus, setHasFocus] = React.useState(false);
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
  return (0, _useRenderElement.useRenderElement)('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [{
      'aria-hidden': !expanded && !hasFocus,
      onClick() {
        store.closeToast(toast.id);
      },
      onFocus() {
        setHasFocus(true);
      },
      onBlur() {
        setHasFocus(false);
      }
    }, elementProps, getButtonProps]
  });
});
if (process.env.NODE_ENV !== "production") ToastClose.displayName = "ToastClose";