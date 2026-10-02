"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverPositioner = void 0;
var React = _interopRequireWildcard(require("react"));
var _inertValue = require("@base-ui/utils/inertValue");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _floatingUiReact = require("../../floating-ui-react");
var _PopoverRootContext = require("../root/PopoverRootContext");
var _PopoverPositionerContext = require("./PopoverPositionerContext");
var _useAnchorPositioning = require("../../internals/useAnchorPositioning");
var _PopoverPortalContext = require("../portal/PopoverPortalContext");
var _InternalBackdrop = require("../../utils/InternalBackdrop");
var _reasons = require("../../internals/reasons");
var _constants = require("../../internals/constants");
var _useAnimationsFinished = require("../../internals/useAnimationsFinished");
var _usePositioner = require("../../utils/usePositioner");
var _useAnchoredPopupScrollLock = require("../../utils/useAnchoredPopupScrollLock");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Positions the popover against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverPositioner = exports.PopoverPositioner = /*#__PURE__*/React.forwardRef(function PopoverPositioner(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    anchor,
    // `useAnchorPositioning` applies the same defaults to the undefined values; the names
    // remain destructured to exclude the props from `elementProps`.
    positionMethod,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding,
    sticky,
    disableAnchorTracking = false,
    collisionAvoidance = _constants.POPUP_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;
  const store = (0, _PopoverRootContext.usePopoverRootContext)();
  const keepMounted = (0, _PopoverPortalContext.usePopoverPortalContext)();
  const nodeId = (0, _floatingUiReact.useFloatingNodeId)();
  const floatingRootContext = store.useState('floatingRootContext');
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openReason = store.useState('openChangeReason');
  const triggerElement = store.useState('activeTriggerElement');
  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const adaptiveOrigin = store.useState('adaptiveOrigin');
  const prevTriggerElementRef = React.useRef(null);
  const runOnceAnimationsFinish = (0, _useAnimationsFinished.useAnimationsFinished)(positionerElement);
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
    adaptiveOrigin
  });
  const domReference = floatingRootContext.useState('domReferenceElement');

  // When the current trigger element changes, enable transitions on the
  // positioner temporarily
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const currentTriggerElement = domReference;
    const prevTriggerElement = prevTriggerElementRef.current;
    if (currentTriggerElement) {
      prevTriggerElementRef.current = currentTriggerElement;
    }
    if (prevTriggerElement && currentTriggerElement && currentTriggerElement !== prevTriggerElement) {
      store.set('instantType', undefined);
      const ac = new AbortController();
      runOnceAnimationsFinish(() => {
        store.set('instantType', 'trigger-change');
      }, ac.signal);
      return () => {
        ac.abort();
      };
    }
    return undefined;
  }, [domReference, runOnceAnimationsFinish, store]);
  const trueModalNonHover = modal === true && openReason !== _reasons.REASONS.triggerHover;
  (0, _useAnchoredPopupScrollLock.useAnchoredPopupScrollLock)(open && trueModalNonHover, openMethod === 'touch', positionerElement, triggerElement);
  const setPositionerElement = store.useStateSetter('positionerElement');
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
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PopoverPositionerContext.PopoverPositionerContext.Provider, {
    value: positioning,
    children: [mounted && trueModalNonHover && /*#__PURE__*/(0, _jsxRuntime.jsx)(_InternalBackdrop.InternalBackdrop, {
      inert: (0, _inertValue.inertValue)(!open),
      cutout: triggerElement
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingNode, {
      id: nodeId,
      children: element
    })]
  });
});
if (process.env.NODE_ENV !== "production") PopoverPositioner.displayName = "PopoverPositioner";