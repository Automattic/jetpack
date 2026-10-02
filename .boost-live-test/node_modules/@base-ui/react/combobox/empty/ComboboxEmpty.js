"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxEmpty = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _useInitialLiveRegionTextMutation = require("../utils/useInitialLiveRegionTextMutation");
/**
 * Renders its children only when the list is empty.
 * Requires the `items` prop on the root component.
 * Announces changes politely to screen readers.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxEmpty = exports.ComboboxEmpty = /*#__PURE__*/React.forwardRef(function ComboboxEmpty(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children: childrenProp,
    ...elementProps
  } = componentProps;
  const {
    filteredItems
  } = (0, _ComboboxRootContext.useComboboxDerivedItemsContext)();
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const emptyRef = (0, _useInitialLiveRegionTextMutation.useInitialLiveRegionTextMutation)();
  const children = filteredItems.length === 0 ? childrenProp : null;
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, store.context.emptyRef, emptyRef],
    props: [{
      children,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': true
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxEmpty.displayName = "ComboboxEmpty";