"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxStatus = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _useInitialLiveRegionTextMutation = require("../utils/useInitialLiveRegionTextMutation");
/**
 * Displays a status message whose content changes are announced politely to screen readers.
 * Useful for conveying the status of an asynchronously loaded list.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxStatus = exports.ComboboxStatus = /*#__PURE__*/React.forwardRef(function ComboboxStatus(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children: childrenProp,
    ...elementProps
  } = componentProps;
  const statusRef = (0, _useInitialLiveRegionTextMutation.useInitialLiveRegionTextMutation)();
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, statusRef],
    props: [{
      children: childrenProp,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': true
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxStatus.displayName = "ComboboxStatus";