"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProgressIndicator = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ProgressRootContext = require("../root/ProgressRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
/**
 * Visualizes the completion status of the task.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressIndicator = exports.ProgressIndicator = /*#__PURE__*/React.forwardRef(function ProgressIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    percentageValue,
    state
  } = (0, _ProgressRootContext.useProgressRootContext)();
  const indicatorStyle = percentageValue == null ? {} : {
    insetInlineStart: 0,
    height: 'inherit',
    width: `${percentageValue}%`
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      style: indicatorStyle
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressIndicator.displayName = "ProgressIndicator";