"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FloatingFocusManager = FloatingFocusManager;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _addEventListener = require("@base-ui/utils/addEventListener");
var _mergeCleanups = require("@base-ui/utils/mergeCleanups");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _platform = require("@base-ui/utils/platform");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _owner = require("@base-ui/utils/owner");
var _FocusGuard = require("../../utils/FocusGuard");
var _element = require("../utils/element");
var _event = require("../utils/event");
var _tabbable = require("../utils/tabbable");
var _nodes = require("../utils/nodes");
var _composite = require("../utils/composite");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _createAttribute = require("../utils/createAttribute");
var _enqueueFocus = require("../utils/enqueueFocus");
var _markOthers = require("../utils/markOthers");
var _FloatingPortal = require("./FloatingPortal");
var _FloatingTree = require("./FloatingTree");
var _constants = require("../../internals/constants");
var _resolveRef = require("../../utils/resolveRef");
var _jsxRuntime = require("react/jsx-runtime");
function getEventType(event, lastInteractionType) {
  const win = (0, _owner.ownerWindow)((0, _element.getTarget)(event));
  if (event instanceof win.KeyboardEvent) {
    return 'keyboard';
  }
  if (event instanceof win.FocusEvent) {
    // Focus events can be caused by a preceding pointer interaction (e.g., focusout on outside press).
    // Prefer the last known pointer type if provided, else treat as keyboard.
    return lastInteractionType || 'keyboard';
  }
  if ('pointerType' in event) {
    return event.pointerType || 'keyboard';
  }
  if ('touches' in event) {
    return 'touch';
  }
  if (event instanceof win.MouseEvent) {
    // onClick events may not contain pointer events, and will fall through to here
    return lastInteractionType || (event.detail === 0 ? 'keyboard' : 'mouse');
  }
  return '';
}
const LIST_LIMIT = 20;
let previouslyFocusedElements = [];
function clearDisconnectedPreviouslyFocusedElements() {
  previouslyFocusedElements = previouslyFocusedElements.filter(entry => {
    return entry.deref()?.isConnected;
  });
}
function addPreviouslyFocusedElement(element) {
  clearDisconnectedPreviouslyFocusedElements();
  if (element && (0, _dom.getNodeName)(element) !== 'body') {
    previouslyFocusedElements.push(new WeakRef(element));
    if (previouslyFocusedElements.length > LIST_LIMIT) {
      previouslyFocusedElements = previouslyFocusedElements.slice(-LIST_LIMIT);
    }
  }
}
function getPreviouslyFocusedElement() {
  clearDisconnectedPreviouslyFocusedElements();
  return previouslyFocusedElements[previouslyFocusedElements.length - 1]?.deref();
}
function getFirstTabbableElement(container) {
  if (!container) {
    return null;
  }
  if ((0, _tabbable.isTabbable)(container)) {
    return container;
  }
  return (0, _tabbable.tabbable)(container)[0] || container;
}
function handleTabIndex(floatingFocusElement) {
  if (floatingFocusElement.hasAttribute('tabindex') && !floatingFocusElement.hasAttribute('data-tabindex')) {
    return;
  }
  if (!floatingFocusElement.getAttribute('role')?.includes('dialog')) {
    return;
  }
  const focusableElements = (0, _tabbable.focusable)(floatingFocusElement);
  const tabbableContent = focusableElements.filter(element => {
    const dataTabIndex = element.getAttribute('data-tabindex') || '';
    return (0, _tabbable.isTabbable)(element) || element.hasAttribute('data-tabindex') && !dataTabIndex.startsWith('-');
  });
  const tabIndex = floatingFocusElement.getAttribute('tabindex');
  if (tabbableContent.length === 0) {
    if (tabIndex !== '0') {
      floatingFocusElement.setAttribute('tabindex', '0');
      // Mark our own write so the externally-managed early-return above doesn't
      // mistake it for a user-authored `tabindex` and freeze management.
      floatingFocusElement.setAttribute('data-tabindex', '0');
    }
  } else if (tabIndex !== '-1' || floatingFocusElement.hasAttribute('data-tabindex') && floatingFocusElement.getAttribute('data-tabindex') !== '-1') {
    floatingFocusElement.setAttribute('tabindex', '-1');
    floatingFocusElement.setAttribute('data-tabindex', '-1');
  }
}
/**
 * Provides focus management for the floating element.
 * @see https://floating-ui.com/docs/FloatingFocusManager
 * @internal
 */
function FloatingFocusManager(props) {
  const {
    context,
    children,
    disabled = false,
    initialFocus = true,
    returnFocus = true,
    restoreFocus = false,
    modal = true,
    closeOnFocusOut = true,
    openInteractionType = '',
    nextFocusableElement,
    previousFocusableElement,
    beforeContentFocusGuardRef,
    externalTree,
    getInsideElements
  } = props;
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const domReference = store.useState('domReferenceElement');
  const floating = store.useState('floatingElement');
  const {
    events,
    dataRef
  } = store.context;
  const getNodeId = (0, _useStableCallback.useStableCallback)(() => dataRef.current.floatingContext?.nodeId);
  const ignoreInitialFocus = initialFocus === false;
  // A typeable combobox reference (e.g. input/textarea) with `initialFocus={false}`
  // has different focus semantics: focus is not trapped inside the floating element,
  // so in the modal case the guards are not rendered, but `aria-hidden` is still
  // applied to the outside nodes.
  const isUntrappedTypeableCombobox = (0, _element.isTypeableCombobox)(domReference) && ignoreInitialFocus;
  const initialFocusRef = (0, _useValueAsRef.useValueAsRef)(initialFocus);
  const returnFocusRef = (0, _useValueAsRef.useValueAsRef)(returnFocus);
  const openInteractionTypeRef = (0, _useValueAsRef.useValueAsRef)(openInteractionType);
  const openRef = (0, _useValueAsRef.useValueAsRef)(open);
  const tree = (0, _FloatingTree.useFloatingTree)(externalTree);
  const portalContext = (0, _FloatingPortal.usePortalContext)();
  const preventReturnFocusRef = React.useRef(false);
  const isPointerDownRef = React.useRef(false);
  const pointerDownOutsideRef = React.useRef(false);
  const lastFocusedTabbableRef = React.useRef(null);
  const closeTypeRef = React.useRef('');
  const lastInteractionTypeRef = React.useRef('');
  const beforeGuardRef = React.useRef(null);
  const afterGuardRef = React.useRef(null);
  const mergedBeforeGuardRef = (0, _useMergedRefs.useMergedRefs)(beforeGuardRef, beforeContentFocusGuardRef, portalContext?.beforeInsideRef);
  const mergedAfterGuardRef = (0, _useMergedRefs.useMergedRefs)(afterGuardRef, portalContext?.afterInsideRef);
  const blurTimeout = (0, _useTimeout.useTimeout)();
  const pointerDownTimeout = (0, _useTimeout.useTimeout)();
  const restoreFocusFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const isInsidePortal = portalContext != null;
  const floatingFocusElement = (0, _element.getFloatingFocusElement)(floating);
  const getTabbableContent = (0, _useStableCallback.useStableCallback)((container = floatingFocusElement) => {
    return container ? (0, _tabbable.tabbable)(container) : [];
  });
  const getResolvedInsideElements = (0, _useStableCallback.useStableCallback)(() => getInsideElements?.().filter(element => element != null) ?? []);

  // Prevent Tab from escaping the modal when there are no tabbable elements.
  React.useEffect(() => {
    if (disabled || !modal) {
      return undefined;
    }
    function onKeyDown(event) {
      if (event.key === 'Tab') {
        // The focus guards have nothing to focus, so we need to stop the event.
        if ((0, _element.contains)(floatingFocusElement, (0, _element.activeElement)((0, _owner.ownerDocument)(floatingFocusElement))) && getTabbableContent().length === 0 && !isUntrappedTypeableCombobox) {
          (0, _event.stopEvent)(event);
        }
      }
    }
    const doc = (0, _owner.ownerDocument)(floatingFocusElement);
    return (0, _addEventListener.addEventListener)(doc, 'keydown', onKeyDown);
  }, [disabled, floatingFocusElement, modal, isUntrappedTypeableCombobox, getTabbableContent]);

  // Track pointer/keyboard interactions to disambiguate focus and outside presses.
  React.useEffect(() => {
    if (disabled || !open) {
      return undefined;
    }
    const doc = (0, _owner.ownerDocument)(floatingFocusElement);
    function clearPointerDownOutside() {
      pointerDownOutsideRef.current = false;
    }
    function onPointerDown(event) {
      const target = (0, _element.getTarget)(event);
      const insideElements = getResolvedInsideElements();
      const pointerTargetInside = (0, _element.contains)(floating, target) || (0, _element.contains)(domReference, target) || (0, _element.contains)(portalContext?.portalNode, target) || insideElements.some(element => element === target || (0, _element.contains)(element, target));
      pointerDownOutsideRef.current = !pointerTargetInside;
      lastInteractionTypeRef.current = event.pointerType || 'keyboard';
      if (target?.closest(`[${_constants.CLICK_TRIGGER_IDENTIFIER}]`)) {
        isPointerDownRef.current = true;
        // Reset on the next tick so a single click on a click-trigger doesn't
        // permanently suppress focus-out closing for the lifetime of the instance.
        pointerDownTimeout.start(0, () => {
          isPointerDownRef.current = false;
        });
      }
    }
    function onKeyDown() {
      lastInteractionTypeRef.current = 'keyboard';
    }
    return (0, _mergeCleanups.mergeCleanups)((0, _addEventListener.addEventListener)(doc, 'pointerdown', onPointerDown, true), (0, _addEventListener.addEventListener)(doc, 'pointerup', clearPointerDownOutside, true), (0, _addEventListener.addEventListener)(doc, 'pointercancel', clearPointerDownOutside, true), (0, _addEventListener.addEventListener)(doc, 'keydown', onKeyDown, true),
    // Avoid a stale `true` leaking into the next open (e.g. keep-mounted popups)
    // if the popup dismissed between pointerdown and pointerup.
    clearPointerDownOutside);
  }, [disabled, floating, domReference, floatingFocusElement, open, portalContext, pointerDownTimeout, getResolvedInsideElements]);

  // Close on focus out and restore focus within the floating tree when needed.
  React.useEffect(() => {
    if (disabled || !closeOnFocusOut) {
      return undefined;
    }
    const doc = (0, _owner.ownerDocument)(floatingFocusElement);

    // In Safari, buttons lose focus when pressing them.
    function handlePointerDown() {
      isPointerDownRef.current = true;
      pointerDownTimeout.start(0, () => {
        isPointerDownRef.current = false;
      });
    }
    function handleFocusIn(event) {
      const target = (0, _element.getTarget)(event);
      if ((0, _tabbable.isTabbable)(target)) {
        lastFocusedTabbableRef.current = target;
      }
    }
    function handleFocusOutside(event) {
      const relatedTarget = event.relatedTarget;
      const currentTarget = event.currentTarget;
      const target = (0, _element.getTarget)(event);

      // When focus is lost to the body (e.g. on a backdrop press), record the element that
      // had focus so a confirmation dialog opened while the body is focused can return focus
      // to it. Scoped to `modal` to avoid non-modal popups polluting the shared stack.
      if (modal && relatedTarget == null && target != null && (0, _element.contains)(floating, target)) {
        addPreviouslyFocusedElement(target);
      }
      queueMicrotask(() => {
        const nodeId = getNodeId();
        const triggers = store.context.triggerElements;
        const insideElements = getResolvedInsideElements();
        const isRelatedFocusGuard = relatedTarget?.hasAttribute((0, _createAttribute.createAttribute)('focus-guard')) && [beforeGuardRef.current, afterGuardRef.current, portalContext?.beforeInsideRef.current, portalContext?.afterInsideRef.current, portalContext?.beforeOutsideRef.current, portalContext?.afterOutsideRef.current, (0, _resolveRef.resolveRef)(previousFocusableElement), (0, _resolveRef.resolveRef)(nextFocusableElement)].includes(relatedTarget);
        const movedToUnrelatedNode = !((0, _element.contains)(domReference, relatedTarget) || (0, _element.contains)(floating, relatedTarget) || (0, _element.contains)(relatedTarget, floating) || (0, _element.contains)(portalContext?.portalNode, relatedTarget) || insideElements.some(element => element === relatedTarget || (0, _element.contains)(element, relatedTarget)) || triggers.hasMatchingElement(trigger => (0, _element.contains)(trigger, relatedTarget)) || isRelatedFocusGuard || tree && ((0, _nodes.getNodeChildren)(tree.nodesRef.current, nodeId).find(node => (0, _element.contains)(node.context?.elements.floating, relatedTarget) || (0, _element.contains)(node.context?.elements.domReference, relatedTarget)) || (0, _nodes.getNodeAncestors)(tree.nodesRef.current, nodeId).find(node => [node.context?.elements.floating, (0, _element.getFloatingFocusElement)(node.context?.elements.floating)].includes(relatedTarget) || node.context?.elements.domReference === relatedTarget)));
        if (currentTarget === domReference && floatingFocusElement) {
          handleTabIndex(floatingFocusElement);
        }

        // Restore focus to the previously focused tabbable element to prevent
        // focus from being lost outside the floating tree.
        if (restoreFocus && currentTarget !== domReference && !(0, _composite.isElementVisible)(target) && (0, _element.activeElement)(doc) === doc.body) {
          // Let `FloatingPortal` effect knows that focus is still inside the
          // floating tree.
          if ((0, _dom.isHTMLElement)(floatingFocusElement)) {
            floatingFocusElement.focus();
            // If explicitly requested to restore focus to the popup container, do not search
            // for the next/previous tabbable element.
            if (restoreFocus === 'popup') {
              // If the focused element is removed on pointerdown, the browser
              // tries to move focus to it right after the `.focus()` call above,
              // but because it's removed in the same tick, focus is lost instead.
              // Re-focusing asynchronously (next frame) wins that race.
              restoreFocusFrame.request(() => {
                floatingFocusElement.focus();
              });
              return;
            }
          }
          const tabbableContent = getTabbableContent();
          const prevTabbable = lastFocusedTabbableRef.current;
          const nodeToFocus = (prevTabbable && tabbableContent.includes(prevTabbable) ? prevTabbable : null) || tabbableContent[tabbableContent.length - 1] || floatingFocusElement;
          if ((0, _dom.isHTMLElement)(nodeToFocus)) {
            nodeToFocus.focus();
          }
        }

        // https://github.com/floating-ui/floating-ui/issues/3060
        if (dataRef.current.insideReactTree) {
          dataRef.current.insideReactTree = false;
          return;
        }

        // Focus did not move inside the floating tree, and there are no tabbable
        // portal guards to handle closing.
        if ((isUntrappedTypeableCombobox ? true : !modal) && relatedTarget && movedToUnrelatedNode && !isPointerDownRef.current && (
        // Fix React 18 Strict Mode returnFocus due to double rendering.
        // For an "untrapped" typeable combobox (input role=combobox with
        // initialFocus=false), re-opening the popup and tabbing out should still close it even
        // when the previously focused element (e.g. the next tabbable outside the popup) is
        // focused again. Otherwise, the popup remains open on the second Tab sequence:
        // click input -> Tab (closes) -> click input -> Tab.
        // Allow closing when `isUntrappedTypeableCombobox` regardless of the previously focused element.
        isUntrappedTypeableCombobox || relatedTarget !== getPreviouslyFocusedElement())) {
          preventReturnFocusRef.current = true;
          store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event));
        }
      });
    }
    function markInsideReactTree() {
      if (pointerDownOutsideRef.current) {
        return;
      }
      dataRef.current.insideReactTree = true;
      blurTimeout.start(0, () => {
        dataRef.current.insideReactTree = false;
      });
    }
    const domReferenceElement = (0, _dom.isHTMLElement)(domReference) ? domReference : null;
    if (!floating && !domReferenceElement) {
      return undefined;
    }
    return (0, _mergeCleanups.mergeCleanups)(domReferenceElement && (0, _addEventListener.addEventListener)(domReferenceElement, 'focusout', handleFocusOutside), domReferenceElement && (0, _addEventListener.addEventListener)(domReferenceElement, 'pointerdown', handlePointerDown), floating && (0, _addEventListener.addEventListener)(floating, 'focusin', handleFocusIn), floating && (0, _addEventListener.addEventListener)(floating, 'focusout', handleFocusOutside), floating && portalContext && (0, _addEventListener.addEventListener)(floating, 'focusout', markInsideReactTree, true));
  }, [disabled, domReference, floating, floatingFocusElement, modal, tree, portalContext, store, closeOnFocusOut, restoreFocus, getTabbableContent, isUntrappedTypeableCombobox, getNodeId, dataRef, blurTimeout, pointerDownTimeout, restoreFocusFrame, nextFocusableElement, previousFocusableElement, getResolvedInsideElements]);

  // Hide everything outside the floating tree from assistive tech while open.
  React.useEffect(() => {
    if (disabled || !floating || !open) {
      return undefined;
    }

    // Don't hide portals nested within the parent portal.
    const portalNodes = Array.from(portalContext?.portalNode?.querySelectorAll(`[${(0, _createAttribute.createAttribute)('portal')}]`) || []);
    const ancestors = tree ? (0, _nodes.getNodeAncestors)(tree.nodesRef.current, getNodeId()) : [];
    const rootAncestorComboboxDomReference = ancestors.find(node => (0, _element.isTypeableCombobox)(node.context?.elements.domReference || null))?.context?.elements.domReference;
    const controlInsideElements = [floating, ...portalNodes, beforeGuardRef.current, afterGuardRef.current, portalContext?.beforeOutsideRef.current, portalContext?.afterOutsideRef.current, ...getResolvedInsideElements()];
    const insideElements = [...controlInsideElements, rootAncestorComboboxDomReference, (0, _resolveRef.resolveRef)(previousFocusableElement), (0, _resolveRef.resolveRef)(nextFocusableElement), isUntrappedTypeableCombobox ? domReference : null].filter(x => x != null);
    const ariaHiddenCleanup = (0, _markOthers.markOthers)(insideElements, {
      ariaHidden: modal || isUntrappedTypeableCombobox,
      mark: false
    });
    const markerInsideElements = [floating, ...portalNodes].filter(x => x != null);
    const markerCleanup = (0, _markOthers.markOthers)(markerInsideElements);
    return () => {
      markerCleanup();
      ariaHiddenCleanup();
    };
  }, [open, disabled, domReference, floating, modal, portalContext, isUntrappedTypeableCombobox, tree, getNodeId, nextFocusableElement, previousFocusableElement, getResolvedInsideElements]);

  // Focus the initial element when the floating element opens.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open || disabled || !(0, _dom.isHTMLElement)(floatingFocusElement)) {
      return;
    }
    closeTypeRef.current = '';
    lastInteractionTypeRef.current = '';
    const doc = (0, _owner.ownerDocument)(floatingFocusElement);
    const previouslyFocusedElement = (0, _element.activeElement)(doc);

    // Wait for any layout effect state setters to execute to set `tabIndex`.
    queueMicrotask(() => {
      const initialFocusValueOrFn = initialFocusRef.current;
      const resolvedInitialFocus = typeof initialFocusValueOrFn === 'function' ? initialFocusValueOrFn(openInteractionTypeRef.current || '') : initialFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedInitialFocus === undefined || resolvedInitialFocus === false) {
        return;
      }
      const focusAlreadyInsideFloatingEl = (0, _element.contains)(floatingFocusElement, previouslyFocusedElement);
      if (focusAlreadyInsideFloatingEl) {
        return;
      }
      let focusableElements = null;
      const getDefaultFocusElement = () => {
        if (focusableElements == null) {
          focusableElements = getTabbableContent(floatingFocusElement);
        }
        return focusableElements[0] || floatingFocusElement;
      };
      let elToFocus;
      if (resolvedInitialFocus === true || resolvedInitialFocus === null) {
        elToFocus = getDefaultFocusElement();
      } else {
        elToFocus = (0, _resolveRef.resolveRef)(resolvedInitialFocus);
      }
      elToFocus = elToFocus || getDefaultFocusElement();
      const hadFocusInside = (0, _element.contains)(floatingFocusElement, (0, _element.activeElement)(doc));

      // enqueueFocus returns a rAF-cancel function; we intentionally don't cancel this focus.
      void (0, _enqueueFocus.enqueueFocus)(elToFocus, {
        preventScroll: elToFocus === floatingFocusElement,
        shouldFocus() {
          // This focus is queued on the next animation frame. If the floating element has closed
          // before it runs — e.g. tabbing out of a kept-mounted popup — don't pull focus back
          // onto the initial element after it has legitimately moved elsewhere.
          if (!openRef.current) {
            return false;
          }
          if (hadFocusInside) {
            return true;
          }
          const currentActiveElement = (0, _element.activeElement)(doc);
          const focusMovedInside = currentActiveElement !== elToFocus && (0, _element.contains)(floatingFocusElement, currentActiveElement);
          return !focusMovedInside;
        }
      });
    });
  }, [disabled, open, floatingFocusElement, getTabbableContent, initialFocusRef, openInteractionTypeRef, openRef]);

  // Track return focus targets and restore focus on unmount/close.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (disabled || !floatingFocusElement) {
      return undefined;
    }
    const doc = (0, _owner.ownerDocument)(floatingFocusElement);
    const elementFocusedBeforeOpen = (0, _element.activeElement)(doc);
    // Only an explicit `null` interaction type represents a programmatic open.
    // `undefined` is normalized to `''` by the prop default, so it never reaches
    // here as nullish and is intentionally not treated as programmatic.
    const preferPreviousFocus = openInteractionTypeRef.current == null;
    addPreviouslyFocusedElement(elementFocusedBeforeOpen);
    function onOpenChangeLocal(details) {
      if (!details.open) {
        closeTypeRef.current = getEventType(details.nativeEvent, lastInteractionTypeRef.current);
      }
      if (details.reason === _reasons.REASONS.triggerHover && details.nativeEvent.type === 'mouseleave') {
        preventReturnFocusRef.current = true;
      }
      if (details.reason !== _reasons.REASONS.outsidePress) {
        return;
      }
      if (details.nested) {
        preventReturnFocusRef.current = false;
      } else if ((0, _event.isVirtualClick)(details.nativeEvent) || (0, _event.isVirtualPointerEvent)(details.nativeEvent)) {
        preventReturnFocusRef.current = false;
      } else {
        // On outside press, only return focus to the reference when the browser supports the
        // `focus({ preventScroll })` option; without it, restoring focus scrolls the page.
        // Chrome on Android and Samsung Internet still don't support `preventScroll`
        // (https://issues.chromium.org/issues/41453122), so the runtime check keeps return
        // focus disabled there to avoid the scroll jump.
        let isPreventScrollSupported = false;
        (0, _owner.ownerDocument)(floatingFocusElement).createElement('div').focus({
          get preventScroll() {
            isPreventScrollSupported = true;
            return false;
          }
        });
        if (isPreventScrollSupported) {
          preventReturnFocusRef.current = false;
        } else {
          preventReturnFocusRef.current = true;
        }
      }
    }
    events.on('openchange', onOpenChangeLocal);
    function getReturnElement(closeType) {
      const returnFocusValueOrFn = returnFocusRef.current;
      let resolvedReturnFocusValue = typeof returnFocusValueOrFn === 'function' ? returnFocusValueOrFn(closeType) : returnFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedReturnFocusValue === undefined || resolvedReturnFocusValue === false) {
        return null;
      }
      if (resolvedReturnFocusValue === null) {
        resolvedReturnFocusValue = true;
      }
      const referenceReturnElement = domReference?.isConnected ? domReference : null;
      const previousReturnElement = elementFocusedBeforeOpen?.isConnected && (0, _dom.getNodeName)(elementFocusedBeforeOpen) !== 'body' ? elementFocusedBeforeOpen : null;
      let defaultReturnElement = preferPreviousFocus ? previousReturnElement || referenceReturnElement : referenceReturnElement || previousReturnElement;
      if (!defaultReturnElement) {
        defaultReturnElement = getPreviouslyFocusedElement() || null;
      }
      if (typeof resolvedReturnFocusValue === 'boolean') {
        return defaultReturnElement;
      }
      return (0, _resolveRef.resolveRef)(resolvedReturnFocusValue) || defaultReturnElement || null;
    }
    return () => {
      events.off('openchange', onOpenChangeLocal);
      const activeEl = (0, _element.activeElement)(doc);
      const insideElements = getResolvedInsideElements();
      const isFocusInsideFloatingTree = (0, _element.contains)(floating, activeEl) || insideElements.some(element => element === activeEl || (0, _element.contains)(element, activeEl)) || tree && (0, _nodes.getNodeChildren)(tree.nodesRef.current, getNodeId(), false).some(node => (0, _element.contains)(node.context?.elements.floating, activeEl));

      // eslint-disable-next-line react-hooks/exhaustive-deps
      const returnFocusValueOrFn = returnFocusRef.current;
      const closeType = closeTypeRef.current;
      const returnElement = getReturnElement(closeType);
      queueMicrotask(() => {
        // `returnElement` if it is tabbable, otherwise its first tabbable child,
        // otherwise `returnElement` itself (which may not be tabbable at all).
        const tabbableReturnElement = getFirstTabbableElement(returnElement);
        const hasExplicitReturnFocus = typeof returnFocusValueOrFn !== 'boolean';
        if (returnFocusValueOrFn && !preventReturnFocusRef.current && (0, _dom.isHTMLElement)(tabbableReturnElement) && (
        // If the focus moved somewhere else after mount, avoid returning focus
        // since it likely entered a different element which should be
        // respected: https://github.com/floating-ui/floating-ui/issues/2607
        !hasExplicitReturnFocus && tabbableReturnElement !== activeEl && activeEl !== doc.body ? isFocusInsideFloatingTree : true)) {
          const focusOptions = {
            preventScroll: true
          };
          if (closeType === 'keyboard') {
            focusOptions.focusVisible = true;
          }
          tabbableReturnElement.focus(focusOptions);
        }
        preventReturnFocusRef.current = false;
      });
    };
  }, [disabled, floating, floatingFocusElement, returnFocusRef, openInteractionTypeRef, events, tree, domReference, getNodeId, getResolvedInsideElements]);

  // Safari may randomly scroll to the bottom of the page if an input inside a popup has focus
  // when the popup unmounts from the DOM.
  // By blurring it before the popup unmounts, we can prevent this behavior.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!_platform.platform.engine.webkit || open || !floating) {
      return;
    }
    const activeEl = (0, _element.activeElement)((0, _owner.ownerDocument)(floating));
    if (!(0, _dom.isHTMLElement)(activeEl) || !(0, _element.isTypeableElement)(activeEl)) {
      return;
    }
    if ((0, _element.contains)(floating, activeEl)) {
      activeEl.blur();
    }
  }, [open, floating]);

  // Synchronize the focus manager state (modal, closeOnFocusOut, open, etc.) to the
  // FloatingPortal context, which uses it to decide whether to render its own guards.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (disabled || !portalContext) {
      return undefined;
    }
    portalContext.setFocusManagerState({
      modal,
      closeOnFocusOut,
      open,
      onOpenChange: store.setOpen,
      domReference
    });
    return () => {
      portalContext.setFocusManagerState(null);
    };
  }, [disabled, portalContext, modal, open, store, closeOnFocusOut, domReference]);

  // Keep the floating element tabIndex in sync and clear stale focus records.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (disabled || !floatingFocusElement) {
      return undefined;
    }
    handleTabIndex(floatingFocusElement);
    return () => {
      queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
    };
  }, [disabled, floatingFocusElement]);
  const shouldRenderGuards = !disabled && (modal ? !isUntrappedTypeableCombobox : true) && (isInsidePortal || modal);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [shouldRenderGuards && /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
      "data-type": "inside",
      ref: mergedBeforeGuardRef,
      onFocus: event => {
        if (modal) {
          const els = getTabbableContent();
          // enqueueFocus returns a rAF-cancel function we don't need here.
          void (0, _enqueueFocus.enqueueFocus)(els[els.length - 1]);
        } else if (portalContext?.portalNode) {
          preventReturnFocusRef.current = false;
          if ((0, _tabbable.isOutsideEvent)(event, portalContext.portalNode)) {
            const nextTabbable = (0, _tabbable.getNextTabbable)(domReference);
            nextTabbable?.focus();
          } else {
            (0, _resolveRef.resolveRef)(previousFocusableElement ?? portalContext.beforeOutsideRef)?.focus();
          }
        }
      }
    }), children, shouldRenderGuards && /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
      "data-type": "inside",
      ref: mergedAfterGuardRef,
      onFocus: event => {
        if (modal) {
          // enqueueFocus returns a rAF-cancel function we don't need here.
          void (0, _enqueueFocus.enqueueFocus)(getTabbableContent()[0]);
        } else if (portalContext?.portalNode) {
          if (closeOnFocusOut) {
            preventReturnFocusRef.current = true;
          }
          if ((0, _tabbable.isOutsideEvent)(event, portalContext.portalNode)) {
            const prevTabbable = (0, _tabbable.getPreviousTabbable)(domReference);
            prevTabbable?.focus();
          } else {
            (0, _resolveRef.resolveRef)(nextFocusableElement ?? portalContext.afterOutsideRef)?.focus();
          }
        }
      }
    })]
  });
}