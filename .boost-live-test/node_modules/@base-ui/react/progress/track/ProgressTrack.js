"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProgressTrack = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ProgressRootContext = require("../root/ProgressRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
/**
 * Contains the progress bar indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressTrack = exports.ProgressTrack = /*#__PURE__*/React.forwardRef(function ProgressTrack(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = (0, _ProgressRootContext.useProgressRootContext)();
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressTrack.displayName = "ProgressTrack";