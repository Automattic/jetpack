"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _PreviewCardPositionerContext = require("../positioner/PreviewCardPositionerContext");
var _PreviewCardContext = require("../root/PreviewCardContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Displays an element positioned against the preview card anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardArrow = exports.PreviewCardArrow = /*#__PURE__*/React.forwardRef(function PreviewCardArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _PreviewCardContext.usePreviewCardRootContext)();
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _PreviewCardPositionerContext.usePreviewCardPositionerContext)();
  const open = store.useState('open');
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [arrowRef, forwardedRef],
    props: [{
      style: arrowStyles,
      'aria-hidden': true
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.popupStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PreviewCardArrow.displayName = "PreviewCardArrow";