"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _PreviewCardContext = require("../root/PreviewCardContext");
var _PreviewCardPositionerContext = require("../positioner/PreviewCardPositionerContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _usePopupViewport = require("../../utils/usePopupViewport");
/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardViewport = exports.PreviewCardViewport = /*#__PURE__*/React.forwardRef(function PreviewCardViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const store = (0, _PreviewCardContext.usePreviewCardRootContext)();
  const positioner = (0, _PreviewCardPositionerContext.usePreviewCardPositionerContext)();
  const instantType = store.useState('instantType');
  const {
    children: childrenToRender,
    state: viewportState
  } = (0, _usePopupViewport.usePopupViewport)({
    store,
    side: positioner.side,
    children
  });
  const state = {
    activationDirection: viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, {
      children: childrenToRender
    }],
    stateAttributesMapping: _usePopupViewport.popupViewportStateMapping
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardViewport.displayName = "PreviewCardViewport";