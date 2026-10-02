"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxInternalDismissButton = void 0;
var React = _interopRequireWildcard(require("react"));
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _useButton = require("../../internals/use-button");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * @internal
 */
const ComboboxInternalDismissButton = exports.ComboboxInternalDismissButton = /*#__PURE__*/React.forwardRef(function ComboboxInternalDismissButton(_, forwardedRef) {
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const {
    buttonRef,
    getButtonProps
  } = (0, _useButton.useButton)({
    native: false
  });
  const mergedRef = (0, _useMergedRefs.useMergedRefs)(forwardedRef, buttonRef);
  function handleDismiss(event) {
    store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.closePress, event.nativeEvent, event.currentTarget));
  }
  const dismissProps = getButtonProps({
    onClick: handleDismiss
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
    ref: mergedRef,
    ...dismissProps,
    "aria-label": "Dismiss",
    tabIndex: undefined,
    style: _visuallyHidden.visuallyHiddenInput
  });
});
if (process.env.NODE_ENV !== "production") ComboboxInternalDismissButton.displayName = "ComboboxInternalDismissButton";