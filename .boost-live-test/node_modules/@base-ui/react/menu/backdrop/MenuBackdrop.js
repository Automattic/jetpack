"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuBackdrop = void 0;
var React = _interopRequireWildcard(require("react"));
var _MenuRootContext = require("../root/MenuRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _ContextMenuRootContext = require("../../context-menu/root/ContextMenuRootContext");
var _reasons = require("../../internals/reasons");
/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuBackdrop = exports.MenuBackdrop = /*#__PURE__*/React.forwardRef(function MenuBackdrop(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    store
  } = (0, _MenuRootContext.useMenuRootContext)();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const contextMenuContext = (0, _ContextMenuRootContext.useContextMenuRootContext)();
  const state = {
    open,
    transitionStatus
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: contextMenuContext?.backdropRef ? [forwardedRef, contextMenuContext.backdropRef] : forwardedRef,
    state,
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping,
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        pointerEvents: lastOpenChangeReason === _reasons.REASONS.triggerHover ? 'none' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MenuBackdrop.displayName = "MenuBackdrop";