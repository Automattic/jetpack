"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScrollAreaCorner = void 0;
var React = _interopRequireWildcard(require("react"));
var _ScrollAreaRootContext = require("../root/ScrollAreaRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaCorner = exports.ScrollAreaCorner = /*#__PURE__*/React.forwardRef(function ScrollAreaCorner(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    cornerRef,
    cornerSize,
    hiddenState
  } = (0, _ScrollAreaRootContext.useScrollAreaRootContext)();
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, cornerRef],
    props: [{
      'aria-hidden': true,
      style: {
        position: 'absolute',
        bottom: 0,
        insetInlineEnd: 0,
        width: cornerSize.width,
        height: cornerSize.height
      }
    }, elementProps]
  });
  if (hiddenState.corner) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") ScrollAreaCorner.displayName = "ScrollAreaCorner";