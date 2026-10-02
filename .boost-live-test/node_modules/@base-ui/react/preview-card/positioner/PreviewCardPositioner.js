"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardPositioner = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _PreviewCardContext = require("../root/PreviewCardContext");
var _PreviewCardPositionerContext = require("./PreviewCardPositionerContext");
var _floatingUiReact = require("../../floating-ui-react");
var _useAnchorPositioning = require("../../internals/useAnchorPositioning");
var _PreviewCardPortalContext = require("../portal/PreviewCardPortalContext");
var _constants = require("../../internals/constants");
var _usePositioner = require("../../utils/usePositioner");
var _popups = require("../../utils/popups");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardPositioner = exports.PreviewCardPositioner = /*#__PURE__*/React.forwardRef(function PreviewCardPositioner(componentProps, forwardedRef) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    disableAnchorTracking = false,
    collisionAvoidance = _constants.POPUP_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _PreviewCardContext.usePreviewCardRootContext)();
  const keepMounted = (0, _PreviewCardPortalContext.usePreviewCardPortalContext)();
  const nodeId = (0, _floatingUiReact.useFloatingNodeId)();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const floatingRootContext = store.useState('floatingRootContext');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const adaptiveOrigin = store.useState('adaptiveOrigin');
  const inlineRectCoordsRef = store.context.inlineRectCoordsRef;
  const positioning = (0, _useAnchorPositioning.useAnchorPositioning)({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    disableAnchorTracking,
    keepMounted,
    nodeId,
    collisionAvoidance,
    adaptiveOrigin,
    inline: (0, _popups.createInlineMiddleware)(inlineRectCoordsRef)
  });
  const updatePosition = positioning.update;
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open && mounted) {
      updatePosition();
    }
  }, [open, mounted, updatePosition]);
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    instant: instantType
  };
  const element = (0, _usePositioner.usePositioner)(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, store.useStateSetter('positionerElement')],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PreviewCardPositionerContext.PreviewCardPositionerContext.Provider, {
    value: positioning,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingNode, {
      id: nodeId,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardPositioner.displayName = "PreviewCardPositioner";