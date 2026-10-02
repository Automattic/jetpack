"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuPositioner = void 0;
var React = _interopRequireWildcard(require("react"));
var _inertValue = require("@base-ui/utils/inertValue");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _floatingUiReact = require("../../floating-ui-react");
var _MenuPositionerContext = require("./MenuPositionerContext");
var _MenuRootContext = require("../root/MenuRootContext");
var _useAnchorPositioning = require("../../internals/useAnchorPositioning");
var _CompositeList = require("../../internals/composite/list/CompositeList");
var _InternalBackdrop = require("../../utils/InternalBackdrop");
var _MenuPortalContext = require("../portal/MenuPortalContext");
var _constants = require("../../internals/constants");
var _ContextMenuRootContext = require("../../context-menu/root/ContextMenuRootContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useAnimationsFinished = require("../../internals/useAnimationsFinished");
var _usePositioner = require("../../utils/usePositioner");
var _useAnchoredPopupScrollLock = require("../../utils/useAnchoredPopupScrollLock");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Positions the menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuPositioner = exports.MenuPositioner = /*#__PURE__*/React.forwardRef(function MenuPositioner(componentProps, forwardedRef) {
  const {
    anchor: anchorProp,
    positionMethod: positionMethodProp = 'absolute',
    className,
    render,
    side,
    align: alignProp,
    sideOffset: sideOffsetProp = 0,
    alignOffset: alignOffsetProp = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    disableAnchorTracking = false,
    collisionAvoidance: collisionAvoidanceProp = _constants.DROPDOWN_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = componentProps;
  const {
    store
  } = (0, _MenuRootContext.useMenuRootContext)();
  const keepMounted = (0, _MenuPortalContext.useMenuPortalContext)();
  const contextMenuContext = (0, _ContextMenuRootContext.useContextMenuRootContext)(true);
  const parent = store.useState('parent');
  const floatingRootContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  const triggerElement = store.useState('activeTriggerElement');
  const transitionStatus = store.useState('transitionStatus');
  const positionerElement = store.useState('positionerElement');
  const instantType = store.useState('instantType');
  const adaptiveOrigin = store.useState('adaptiveOrigin');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const floatingNodeId = store.useState('floatingNodeId');
  const floatingParentNodeId = store.useState('floatingParentNodeId');
  const domReference = floatingRootContext.useState('domReferenceElement');
  const previousTriggerRef = React.useRef(null);
  const runOnceAnimationsFinish = (0, _useAnimationsFinished.useAnimationsFinished)(positionerElement);
  let anchor = anchorProp;
  let sideOffset = sideOffsetProp;
  let alignOffset = alignOffsetProp;
  let align = alignProp;
  let collisionAvoidance = collisionAvoidanceProp;
  if (parent.type === 'context-menu') {
    anchor = anchorProp ?? parent.context?.anchor;
    align = align ?? 'start';
    if (!side && align !== 'center') {
      alignOffset = componentProps.alignOffset ?? 2;
      sideOffset = componentProps.sideOffset ?? -5;
    }
  }
  let computedSide = side;
  let computedAlign = align;
  if (parent.type === 'menu') {
    computedSide = computedSide ?? 'inline-end';
    computedAlign = computedAlign ?? 'start';
    collisionAvoidance = componentProps.collisionAvoidance ?? _constants.POPUP_COLLISION_AVOIDANCE;
  } else if (parent.type === 'menubar') {
    computedSide = computedSide ?? (parent.context.orientation === 'vertical' ? 'inline-end' : 'bottom');
    computedAlign = computedAlign ?? 'start';
  }
  const contextMenu = parent.type === 'context-menu';
  const positioner = (0, _useAnchorPositioning.useAnchorPositioning)({
    anchor,
    floatingRootContext,
    positionMethod: contextMenuContext ? 'fixed' : positionMethodProp,
    mounted,
    side: computedSide,
    sideOffset,
    align: computedAlign,
    alignOffset,
    arrowPadding: contextMenu ? 0 : arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    nodeId: floatingNodeId,
    keepMounted,
    disableAnchorTracking,
    collisionAvoidance,
    shift: contextMenu ? {
      crossAxis: !('side' in collisionAvoidance && collisionAvoidance.side === 'flip'),
      rootBoundary: 'layoutViewport'
    } : undefined,
    externalTree: floatingTreeRoot,
    adaptiveOrigin
  });
  React.useEffect(() => {
    function onMenuOpenChange(details) {
      if (details.open) {
        if (details.parentNodeId === floatingNodeId) {
          store.set('hoverEnabled', false);
        }
        if (details.nodeId !== floatingNodeId && details.parentNodeId === store.select('floatingParentNodeId')) {
          store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.siblingOpen));
        }
      }
    }
    floatingTreeRoot.events.on('menuopenchange', onMenuOpenChange);
    return () => {
      floatingTreeRoot.events.off('menuopenchange', onMenuOpenChange);
    };
  }, [store, floatingTreeRoot.events, floatingNodeId]);
  React.useEffect(() => {
    if (store.select('floatingParentNodeId') == null) {
      return undefined;
    }
    function onParentClose(details) {
      if (details.open || details.nodeId !== store.select('floatingParentNodeId')) {
        return;
      }
      const reason = details.reason ?? _reasons.REASONS.siblingOpen;
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(reason));
    }
    floatingTreeRoot.events.on('menuopenchange', onParentClose);
    return () => {
      floatingTreeRoot.events.off('menuopenchange', onParentClose);
    };
  }, [floatingTreeRoot.events, store]);
  const closeTimeout = (0, _useTimeout.useTimeout)();

  // Clear pending close timeout when the menu closes.
  React.useEffect(() => {
    if (!open) {
      closeTimeout.clear();
    }
  }, [open, closeTimeout]);

  // Close unrelated child submenus when hovering a different item in the parent menu.
  React.useEffect(() => {
    function onItemHover(event) {
      // If an item within our parent menu is hovered, and this menu's trigger is not that item,
      // close this submenu. This ensures hovering a different item in the parent closes other branches.
      if (!open || event.nodeId !== store.select('floatingParentNodeId')) {
        return;
      }
      if (event.target && triggerElement && triggerElement !== event.target) {
        const delay = store.select('closeDelay');
        if (delay > 0) {
          if (!closeTimeout.isStarted()) {
            closeTimeout.start(delay, () => {
              store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.siblingOpen));
            });
          }
        } else {
          store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.siblingOpen));
        }
      } else {
        // User re-hovered the submenu trigger, cancel pending close.
        closeTimeout.clear();
      }
    }
    floatingTreeRoot.events.on('itemhover', onItemHover);
    return () => {
      floatingTreeRoot.events.off('itemhover', onItemHover);
    };
  }, [floatingTreeRoot.events, open, triggerElement, store, closeTimeout]);
  React.useEffect(() => {
    const eventDetails = {
      open,
      nodeId: floatingNodeId,
      parentNodeId: floatingParentNodeId,
      reason: store.select('lastOpenChangeReason')
    };
    floatingTreeRoot.events.emit('menuopenchange', eventDetails);
  }, [floatingTreeRoot.events, open, store, floatingNodeId, floatingParentNodeId]);

  // Keep positioner transition behavior aligned with Popover when switching detached triggers.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const currentTrigger = domReference;
    const previousTrigger = previousTriggerRef.current;
    if (currentTrigger) {
      previousTriggerRef.current = currentTrigger;
    }
    if (previousTrigger && currentTrigger && currentTrigger !== previousTrigger) {
      store.set('instantType', undefined);
      const abortController = new AbortController();
      runOnceAnimationsFinish(() => {
        store.set('instantType', 'trigger-change');
      }, abortController.signal);
      return () => {
        abortController.abort();
      };
    }
    return undefined;
  }, [domReference, runOnceAnimationsFinish, store]);
  const state = {
    open,
    side: positioner.side,
    align: positioner.align,
    anchorHidden: positioner.anchorHidden,
    nested: parent.type === 'menu',
    instant: instantType
  };
  const menubarModal = parent.type === 'menubar' && parent.context.modal;
  const popupModal = modal && lastOpenChangeReason !== _reasons.REASONS.triggerHover;
  (0, _useAnchoredPopupScrollLock.useAnchoredPopupScrollLock)(open && (menubarModal || popupModal), openMethod === 'touch', positionerElement, triggerElement);
  const element = (0, _usePositioner.usePositioner)(componentProps, state, {
    styles: positioner.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, store.useStateSetter('positionerElement')],
    hidden: !mounted,
    inert: !open
  });
  const shouldRenderBackdrop = mounted && parent.type !== 'menu' && (parent.type !== 'menubar' && modal && lastOpenChangeReason !== _reasons.REASONS.triggerHover || parent.type === 'menubar' && parent.context.modal);

  // cuts a hole in the backdrop to allow pointer interaction with the menubar or dropdown menu trigger element
  let backdropCutout = null;
  if (parent.type === 'menubar') {
    backdropCutout = parent.context.contentElement;
  } else if (parent.type === undefined) {
    backdropCutout = triggerElement;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_MenuPositionerContext.MenuPositionerContext.Provider, {
    value: positioner,
    children: [shouldRenderBackdrop && /*#__PURE__*/(0, _jsxRuntime.jsx)(_InternalBackdrop.InternalBackdrop, {
      ref: parent.type === 'context-menu' || parent.type === 'nested-context-menu' ? parent.context.internalBackdropRef : null,
      inert: (0, _inertValue.inertValue)(!open),
      cutout: backdropCutout
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingNode, {
      id: floatingNodeId,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeList.CompositeList, {
        elementsRef: store.context.itemDomElements,
        labelsRef: store.context.itemLabels,
        children: element
      })
    })]
  });
});
if (process.env.NODE_ENV !== "production") MenuPositioner.displayName = "MenuPositioner";