"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardBackdrop = void 0;
var React = _interopRequireWildcard(require("react"));
var _PreviewCardContext = require("../root/PreviewCardContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * A presentational overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardBackdrop = exports.PreviewCardBackdrop = /*#__PURE__*/React.forwardRef(function PreviewCardBackdrop(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _PreviewCardContext.usePreviewCardRootContext)();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const state = {
    open,
    transitionStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef],
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PreviewCardBackdrop.displayName = "PreviewCardBackdrop";