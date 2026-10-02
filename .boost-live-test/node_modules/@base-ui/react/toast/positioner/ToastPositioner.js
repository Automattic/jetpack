"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastPositioner = void 0;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _empty = require("@base-ui/utils/empty");
var _useAnchorPositioning = require("../../internals/useAnchorPositioning");
var _constants = require("../../internals/constants");
var _ToastPositionerContext = require("./ToastPositionerContext");
var _floatingUiReact = require("../../floating-ui-react");
var _noop = require("../../internals/noop");
var _ToastProviderContext = require("../provider/ToastProviderContext");
var _usePositioner = require("../../utils/usePositioner");
var ToastRootCssVars = _interopRequireWildcard(require("../root/ToastRootCssVars"));
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Positions the toast against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastPositioner = exports.ToastPositioner = /*#__PURE__*/React.forwardRef(function ToastPositioner(componentProps, forwardedRef) {
  const {
    toast,
    ...props
  } = componentProps;
  const store = (0, _ToastProviderContext.useToastProviderContext)();
  const positionerProps = toast.positionerProps ?? _empty.EMPTY_OBJECT;
  const {
    render,
    className,
    anchor: anchorProp = positionerProps.anchor,
    positionMethod = positionerProps.positionMethod ?? 'absolute',
    side = positionerProps.side ?? 'top',
    align = positionerProps.align ?? 'center',
    sideOffset = positionerProps.sideOffset ?? 0,
    alignOffset = positionerProps.alignOffset ?? 0,
    collisionBoundary = positionerProps.collisionBoundary ?? 'clipping-ancestors',
    collisionPadding = positionerProps.collisionPadding ?? 5,
    arrowPadding = positionerProps.arrowPadding ?? 5,
    sticky = positionerProps.sticky ?? false,
    disableAnchorTracking = positionerProps.disableAnchorTracking ?? false,
    collisionAvoidance = positionerProps.collisionAvoidance ?? _constants.POPUP_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = props;
  const [positionerElement, setPositionerElement] = React.useState(null);
  const domIndex = store.useState('toastIndex', toast.id);
  const visibleIndex = store.useState('toastVisibleIndex', toast.id);
  const anchor = (0, _dom.isElement)(anchorProp) ? anchorProp : null;
  const floatingRootContext = (0, _floatingUiReact.useFloatingRootContext)({
    open: true,
    onOpenChange: _noop.NOOP,
    elements: {
      floating: positionerElement,
      reference: anchor
    }
  });
  const positioning = (0, _useAnchorPositioning.useAnchorPositioning)({
    anchor,
    positionMethod,
    floatingRootContext,
    mounted: true,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    sticky,
    arrowPadding,
    disableAnchorTracking,
    keepMounted: true,
    collisionAvoidance
  });
  const state = {
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden
  };
  const element = (0, _usePositioner.usePositioner)(componentProps, state, {
    styles: {
      ...positioning.positionerStyles,
      [ToastRootCssVars.index]: toast.transitionStatus === 'ending' ? domIndex : visibleIndex
    },
    transitionStatus: toast.transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ToastPositionerContext.ToastPositionerContext.Provider, {
    value: positioning,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ToastPositioner.displayName = "ToastPositioner";