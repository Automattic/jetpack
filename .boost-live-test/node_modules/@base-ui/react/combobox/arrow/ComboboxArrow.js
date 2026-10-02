"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _ComboboxPositionerContext = require("../positioner/ComboboxPositionerContext");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Displays an element positioned against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxArrow = exports.ComboboxArrow = /*#__PURE__*/React.forwardRef(function ComboboxArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _ComboboxPositionerContext.useComboboxPositionerContext)();
  const open = store.useState('open');
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [arrowRef, forwardedRef],
    stateAttributesMapping: _popupStateMapping.popupStateMapping,
    state,
    props: {
      style: arrowStyles,
      'aria-hidden': true,
      ...elementProps
    }
  });
});
if (process.env.NODE_ENV !== "production") ComboboxArrow.displayName = "ComboboxArrow";