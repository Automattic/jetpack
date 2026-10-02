"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useHoverFloatingInteraction = useHoverFloatingInteraction;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _mergeCleanups = require("@base-ui/utils/mergeCleanups");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _owner = require("@base-ui/utils/owner");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _dom = require("@floating-ui/utils/dom");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _FloatingTree = require("../components/FloatingTree");
var _element = require("../utils/element");
var _nodes = require("../utils/nodes");
var _useHoverInteractionSharedState = require("./useHoverInteractionSharedState");
var _useHoverShared = require("./useHoverShared");
/**
 * Provides hover interactions that should be attached to the floating element.
 */
function useHoverFloatingInteraction(context, parameters = {}) {
  const {
    enabled = true,
    closeDelay: closeDelayProp = 0,
    nodeId: nodeIdProp
  } = parameters;
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');
  const {
    dataRef
  } = store.context;
  const tree = (0, _FloatingTree.useFloatingTree)();
  const parentId = (0, _FloatingTree.useFloatingParentNodeId)();
  const instance = (0, _useHoverInteractionSharedState.useHoverInteractionSharedState)(store);
  const childClosedTimeout = (0, _useTimeout.useTimeout)();
  const isClickLikeOpenEvent = (0, _useStableCallback.useStableCallback)(() => {
    return (0, _useHoverShared.isClickLikeOpenEvent)(dataRef.current.openEvent?.type, instance.interactedInside);
  });
  const isHoverOpen = (0, _useStableCallback.useStableCallback)(() => {
    return (0, _useHoverShared.isHoverOpenEvent)(dataRef.current.openEvent?.type);
  });
  const clearPointerEvents = (0, _useStableCallback.useStableCallback)(() => {
    (0, _useHoverInteractionSharedState.clearSafePolygonPointerEventsMutation)(instance);
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open) {
      instance.pointerType = undefined;
      instance.restTimeoutPending = false;
      instance.interactedInside = false;
      clearPointerEvents();
    }
  }, [open, instance, clearPointerEvents]);
  React.useEffect(() => {
    return clearPointerEvents;
  }, [clearPointerEvents]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled) {
      return undefined;
    }
    if (open && instance.handleCloseOptions?.blockPointerEvents && isHoverOpen() && (0, _dom.isElement)(domReferenceElement) && floatingElement) {
      const ref = domReferenceElement;
      const floatingEl = floatingElement;
      const doc = (0, _owner.ownerDocument)(floatingElement);
      const parentFloating = tree?.nodesRef.current.find(node => node.id === parentId)?.context?.elements.floating;
      if (parentFloating) {
        parentFloating.style.pointerEvents = '';
      }

      // A keep-mounted submenu can appear in the tree before it opens, so a
      // cached scope or parent lookup may resolve to the submenu itself. That
      // would not shield sibling items in the parent menu.
      const cachedScopeElement = instance.pointerEventsScopeElement !== floatingEl ? instance.pointerEventsScopeElement : null;
      const parentScopeElement = parentFloating !== floatingEl ? parentFloating : null;
      const scopeElement = instance.handleCloseOptions?.getScope?.() ?? cachedScopeElement ?? parentScopeElement ?? ref.closest('[data-rootownerid]') ?? doc.body;
      (0, _useHoverInteractionSharedState.applySafePolygonPointerEventsMutation)(instance, {
        scopeElement,
        referenceElement: ref,
        floatingElement: floatingEl
      });
      return () => {
        clearPointerEvents();
      };
    }
    return undefined;
  }, [enabled, open, domReferenceElement, floatingElement, instance, isHoverOpen, tree, parentId, clearPointerEvents]);
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function hasParentChildren() {
      return !!(tree && parentId && (0, _nodes.getNodeChildren)(tree.nodesRef.current, parentId).length > 0);
    }
    function closeWithDelay(event) {
      const closeDelay = (0, _useHoverShared.getDelay)(closeDelayProp, 'close', instance.pointerType);
      const close = () => {
        store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event));
        tree?.events.emit('floating.closed', event);
      };
      if (closeDelay) {
        instance.openChangeTimeout.start(closeDelay, close);
      } else {
        instance.openChangeTimeout.clear();
        close();
      }
    }
    function handleInteractInside(event) {
      const target = (0, _element.getTarget)(event);
      if (!(0, _useHoverInteractionSharedState.isInteractiveElement)(target)) {
        instance.interactedInside = false;
        return;
      }
      instance.interactedInside = target?.closest('[aria-haspopup]') != null;
    }
    function onFloatingMouseEnter() {
      instance.openChangeTimeout.clear();
      childClosedTimeout.clear();
      tree?.events.off('floating.closed', onNodeClosed);
      clearPointerEvents();
    }
    function onFloatingMouseLeave(event) {
      if (hasParentChildren() && tree) {
        tree.events.on('floating.closed', onNodeClosed);
        return;
      }
      if ((0, _useHoverShared.isInsideEnabledTrigger)(event.relatedTarget, store.context.triggerElements)) {
        // If the mouse is leaving the reference element to another trigger, don't explicitly close the popup
        // as it will be moved.
        return;
      }
      const currentNodeId = dataRef.current.floatingContext?.nodeId ?? nodeIdProp;
      const relatedTarget = event.relatedTarget;
      const isMovingIntoDescendantFloating = tree && currentNodeId && (0, _dom.isElement)(relatedTarget) && (0, _nodes.getNodeChildren)(tree.nodesRef.current, currentNodeId, false).some(node => (0, _element.contains)(node.context?.elements.floating, relatedTarget));
      if (isMovingIntoDescendantFloating) {
        return;
      }

      // If the safePolygon handler is active, let it handle the close logic.
      if (instance.handler) {
        instance.handler(event);
        return;
      }
      clearPointerEvents();
      if (isHoverOpen() && !isClickLikeOpenEvent()) {
        closeWithDelay(event);
      }
    }
    function onNodeClosed(event) {
      if (!tree || !parentId || hasParentChildren()) {
        return;
      }
      // Allow the mouseenter event to fire in case child was closed because mouse moved into parent.
      childClosedTimeout.start(0, () => {
        tree.events.off('floating.closed', onNodeClosed);
        store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerHover, event));
        tree.events.emit('floating.closed', event);
      });
    }
    const floating = floatingElement;
    return (0, _mergeCleanups.mergeCleanups)(floating && (0, _addEventListener.addEventListener)(floating, 'mouseenter', onFloatingMouseEnter), floating && (0, _addEventListener.addEventListener)(floating, 'mouseleave', onFloatingMouseLeave), floating && (0, _addEventListener.addEventListener)(floating, 'pointerdown', handleInteractInside, true), () => {
      tree?.events.off('floating.closed', onNodeClosed);
    });
  }, [enabled, floatingElement, store, dataRef, closeDelayProp, nodeIdProp, isHoverOpen, isClickLikeOpenEvent, clearPointerEvents, instance, tree, parentId, childClosedTimeout]);
}