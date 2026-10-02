"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _MenuPositionerContext = require("../positioner/MenuPositionerContext");
var _MenuRootContext = require("../root/MenuRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Displays an element positioned against the menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuArrow = exports.MenuArrow = /*#__PURE__*/React.forwardRef(function MenuArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    store
  } = (0, _MenuRootContext.useMenuRootContext)();
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _MenuPositionerContext.useMenuPositionerContext)();
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
if (process.env.NODE_ENV !== "production") MenuArrow.displayName = "MenuArrow";