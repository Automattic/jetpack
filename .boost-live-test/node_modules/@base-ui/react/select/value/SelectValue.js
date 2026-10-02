"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectValue = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _SelectRootContext = require("../root/SelectRootContext");
var _resolveValueLabel = require("../../internals/resolveValueLabel");
const stateAttributesMapping = {
  value: () => null
};

/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectValue = exports.SelectValue = /*#__PURE__*/React.forwardRef(function SelectValue(componentProps, forwardedRef) {
  const {
    className,
    render,
    children: childrenProp,
    placeholder,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const value = store.useState('value');
  const items = store.useState('items');
  const itemToStringLabel = store.useState('itemToStringLabel');
  const hasSelectedValue = store.useState('hasSelectedValue');
  const shouldCheckNullItemLabel = !hasSelectedValue && placeholder != null && childrenProp == null;
  const hasNullLabel = store.useState('hasNullItemLabel', shouldCheckNullItemLabel);
  const state = {
    value,
    placeholder: !hasSelectedValue
  };
  let children = null;
  if (typeof childrenProp === 'function') {
    children = childrenProp(value);
  } else if (childrenProp != null) {
    children = childrenProp;
  } else if (shouldCheckNullItemLabel && !hasNullLabel) {
    children = placeholder;
  } else if (Array.isArray(value)) {
    children = (0, _resolveValueLabel.resolveMultipleLabels)(value, items, itemToStringLabel);
  } else {
    children = (0, _resolveValueLabel.resolveSelectedLabel)(value, items, itemToStringLabel);
  }
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: [forwardedRef, store.context.valueRef],
    props: [{
      children
    }, elementProps],
    stateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SelectValue.displayName = "SelectValue";