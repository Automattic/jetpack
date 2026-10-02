"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Separator = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../internals/useRenderElement");
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
const Separator = exports.Separator = /*#__PURE__*/React.forwardRef(function SeparatorComponent(componentProps, forwardedRef) {
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
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'separator',
      'aria-orientation': orientation
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") Separator.displayName = "Separator";