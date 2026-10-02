"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerIndentBackground = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _DrawerProviderContext = require("../provider/DrawerProviderContext");
const stateAttributesMapping = {
  active(value) {
    if (value) {
      return {
        'data-active': ''
      };
    }
    return {
      'data-inactive': ''
    };
  }
};

/**
 * An element placed before `<Drawer.Indent>` to render a background layer that can be styled based on whether any drawer is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerIndentBackground = exports.DrawerIndentBackground = /*#__PURE__*/React.forwardRef(function DrawerIndentBackground(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const providerContext = (0, _DrawerProviderContext.useDrawerProviderContext)();
  const active = providerContext?.active ?? false;
  const state = {
    active
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") DrawerIndentBackground.displayName = "DrawerIndentBackground";