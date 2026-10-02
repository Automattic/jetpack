"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _DialogRootContext = require("../root/DialogRootContext");
var _DialogPortalContext = require("../portal/DialogPortalContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
/**
 * A positioning container for the dialog popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogViewport = exports.DialogViewport = /*#__PURE__*/React.forwardRef(function DialogViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const keepMounted = (0, _DialogPortalContext.useDialogPortalContext)();
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const open = store.useState('open');
  const nested = store.useState('nested');
  const transitionStatus = store.useState('transitionStatus');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const mounted = store.useState('mounted');
  const setViewportElement = store.useStateSetter('viewportElement');
  const nestedDialogOpen = nestedOpenDialogCount > 0;
  const state = {
    open,
    nested,
    transitionStatus,
    nestedDialogOpen
  };
  const shouldRender = keepMounted || mounted;
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    enabled: shouldRender,
    state,
    ref: [forwardedRef, setViewportElement],
    stateAttributesMapping: _stateAttributesMapping.dialogStateAttributesMapping,
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        pointerEvents: !open ? 'none' : undefined
      },
      children
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DialogViewport.displayName = "DialogViewport";