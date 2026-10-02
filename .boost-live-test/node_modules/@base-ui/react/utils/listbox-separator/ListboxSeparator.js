"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ListboxSeparator = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * A visual separator between items.
 * Renders a `<div>` element.
 *
 * @internal
 */
const ListboxSeparator = exports.ListboxSeparator = /*#__PURE__*/React.forwardRef(function ListboxSeparator(componentProps, forwardedRef) {
  const {
    className,
    render,
    orientation = 'horizontal',
    style,
    ...elementProps
  } = componentProps;
  const state = {
    orientation
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'presentation'
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ListboxSeparator.displayName = "ListboxSeparator";