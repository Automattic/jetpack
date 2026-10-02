"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerContent = void 0;
var React = _interopRequireWildcard(require("react"));
var _DialogRootContext = require("../../dialog/root/DialogRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _drawerContentAttribute = require("./drawerContentAttribute");
/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerContent = exports.DrawerContent = /*#__PURE__*/React.forwardRef(function DrawerContent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  (0, _DialogRootContext.useDialogRootContext)();
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: [{
      [_drawerContentAttribute.DRAWER_CONTENT_ATTRIBUTE]: ''
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DrawerContent.displayName = "DrawerContent";