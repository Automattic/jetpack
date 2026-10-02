"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _error = require("@base-ui/utils/error");
var _safeReact = require("@base-ui/utils/safeReact");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _empty = require("@base-ui/utils/empty");
var _floatingUiReact = require("../../floating-ui-react");
var _DialogRootContext = require("../../dialog/root/DialogRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _popupStateMapping = require("../../utils/popupStateMapping");
var DrawerBackdropCssVars = _interopRequireWildcard(require("../backdrop/DrawerBackdropCssVars"));
var DrawerPopupCssVars = _interopRequireWildcard(require("./DrawerPopupCssVars"));
var DrawerPopupDataAttributes = _interopRequireWildcard(require("./DrawerPopupDataAttributes"));
var _DialogPortalContext = require("../../dialog/portal/DialogPortalContext");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _composite = require("../../internals/composite/composite");
var _DrawerRootContext = require("../root/DrawerRootContext");
var _useDrawerSnapPoints = require("../root/useDrawerSnapPoints");
var _DrawerViewportContext = require("../viewport/DrawerViewportContext");
var _popups = require("../../utils/popups");
var _jsxRuntime = require("react/jsx-runtime");
// Module-level flag to ensure we only register the CSS properties once,
// regardless of how many Drawer components are mounted.
let drawerSwipeVarsRegistered = false;

/**
 * Removes inheritance of high-frequency drawer swipe CSS variables, which
 * reduces style recalculation cost in complex drawers with deep subtrees.
 * See https://motion.dev/blog/web-animation-performance-tier-list
 * under the "Improving CSS variable performance" section.
 */
function removeCSSVariableInheritance() {
  if (drawerSwipeVarsRegistered) {
    return;
  }

  // Intentionally keep inheritance disabled on WebKit as well. Safari doesn't support
  // opting descendants back in via `--var: inherit` for custom properties registered
  // with `inherits: false`, but Drawer does not rely on descendant access to these vars
  // (unlike ScrollArea), so we keep the performance optimization enabled.
  if (typeof CSS !== 'undefined' && 'registerProperty' in CSS) {
    [DrawerPopupCssVars.swipeMovementX, DrawerPopupCssVars.swipeMovementY, DrawerPopupCssVars.snapPointOffset].forEach(name => {
      try {
        CSS.registerProperty({
          name,
          syntax: '<length>',
          inherits: false,
          initialValue: '0px'
        });
      } catch {
        /* ignore already-registered */
      }
    });
    [{
      name: DrawerBackdropCssVars.swipeProgress,
      initialValue: '0'
    }, {
      name: DrawerPopupCssVars.swipeStrength,
      initialValue: '1'
    }].forEach(({
      name,
      initialValue
    }) => {
      try {
        CSS.registerProperty({
          name,
          syntax: '<number>',
          inherits: false,
          initialValue
        });
      } catch {
        /* ignore already-registered */
      }
    });
  }
  drawerSwipeVarsRegistered = true;
}
const stateAttributesMapping = {
  ..._popupStateMapping.popupTransitionStateMapping,
  expanded(value) {
    return value ? {
      [DrawerPopupDataAttributes.expanded]: ''
    } : null;
  },
  nestedDrawerOpen(value) {
    return value ? {
      [DrawerPopupDataAttributes.nestedDrawerOpen]: ''
    } : null;
  },
  nestedDrawerSwiping(value) {
    return value ? {
      [DrawerPopupDataAttributes.nestedDrawerSwiping]: ''
    } : null;
  },
  swipeDirection(value) {
    return {
      [DrawerPopupDataAttributes.swipeDirection]: value
    };
  },
  swiping(value) {
    return value ? {
      [DrawerPopupDataAttributes.swiping]: ''
    } : null;
  }
};

/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerPopup = exports.DrawerPopup = /*#__PURE__*/React.forwardRef(function DrawerPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    finalFocus,
    initialFocus,
    ...elementProps
  } = componentProps;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const popupRef = store.context.popupRef;
  const {
    swipeDirection,
    frontmostHeight,
    hasNestedDrawer,
    nestedSwiping,
    nestedSwipeProgressStore,
    onPopupHeightChange,
    notifyParentFrontmostHeight,
    notifyParentHasNestedDrawer
  } = (0, _DrawerRootContext.useDrawerRootContext)();
  const descriptionElementId = store.useState('descriptionElementId');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const floatingRootContext = store.useState('floatingRootContext');
  const rootPopupProps = store.useState('popupProps');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDrawerCount = store.useState('nestedOpenDrawerCount');
  const transitionStatus = store.useState('transitionStatus');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const titleElementId = store.useState('titleElementId');
  const role = store.useState('role');
  const floatingId = floatingRootContext.useState('floatingId');
  const popupId = elementProps.id ?? floatingId;
  const swipe = (0, _DrawerViewportContext.useDrawerViewportContext)();
  (0, _DialogPortalContext.useDialogPortalContext)();
  const {
    snapPoints,
    activeSnapPoint,
    activeSnapPointOffset
  } = (0, _useDrawerSnapPoints.useDrawerSnapPoints)();
  const nestedDrawerOpen = nestedOpenDrawerCount > 0;
  const swiping = swipe?.swiping ?? false;
  const swipeStrength = swipe?.swipeStrength ?? null;
  const [popupHeight, setPopupHeight] = React.useState(0);
  const popupHeightRef = React.useRef(0);

  /* istanbul ignore else -- process.env.NODE_ENV is a build-time constant. */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (swipe) {
        return;
      }
      const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
      const message = '<Drawer.Popup> expected to be rendered within <Drawer.Viewport>. Omitting the ' + 'viewport disables drawer swipe handling and touch scroll locking. Wrap ' + '<Drawer.Popup> in <Drawer.Viewport>.';
      (0, _error.error)(`${message}${ownerStackMessage}`);
    }, [swipe]);
  }
  const measureHeight = (0, _useStableCallback.useStableCallback)(() => {
    const popupElement = popupRef.current;
    if (!popupElement) {
      return;
    }
    const offsetHeight = popupElement.offsetHeight;

    // Only skip while the element is still actually stretched beyond its last measured height.
    if (popupHeightRef.current > 0 && frontmostHeight > popupHeightRef.current && offsetHeight > popupHeightRef.current) {
      return;
    }
    const keepHeightWhileNested = popupHeightRef.current > 0 && hasNestedDrawer;
    if (keepHeightWhileNested) {
      const oldHeight = popupHeightRef.current;
      setPopupHeight(oldHeight);
      onPopupHeightChange(oldHeight);
      return;
    }
    const nextHeight = offsetHeight;
    if (nextHeight === popupHeightRef.current) {
      return;
    }
    popupHeightRef.current = nextHeight;
    setPopupHeight(nextHeight);
    onPopupHeightChange(nextHeight);
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!mounted) {
      popupHeightRef.current = 0;
      setPopupHeight(0);
      onPopupHeightChange(0);
      return undefined;
    }
    const popupElement = popupRef.current;
    if (!popupElement) {
      return undefined;
    }
    removeCSSVariableInheritance();
    measureHeight();
    if (typeof ResizeObserver !== 'function') {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(popupElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [measureHeight, mounted, nestedDrawerOpen, onPopupHeightChange, popupRef]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const syncNestedSwipeProgress = () => {
      const popupElement = popupRef.current;
      if (!popupElement) {
        return;
      }
      const progress = nestedSwipeProgressStore.getSnapshot();
      if (progress > 0) {
        popupElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${progress}`);
      } else {
        popupElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      }
    };
    syncNestedSwipeProgress();
    const unsubscribe = nestedSwipeProgressStore.subscribe(syncNestedSwipeProgress);
    const popupElement = popupRef.current;
    return () => {
      unsubscribe();
      if (popupElement) {
        popupElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      }
    };
  }, [nestedSwipeProgressStore, popupRef]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open) {
      return undefined;
    }
    notifyParentFrontmostHeight?.(frontmostHeight);
    return () => {
      notifyParentFrontmostHeight?.(0);
    };
  }, [frontmostHeight, open, notifyParentFrontmostHeight]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!notifyParentHasNestedDrawer) {
      return undefined;
    }
    const present = open || transitionStatus === 'ending';
    notifyParentHasNestedDrawer(present);
    return () => {
      notifyParentHasNestedDrawer(false);
    };
  }, [notifyParentHasNestedDrawer, open, transitionStatus]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    }
  });
  const resolvedInitialFocus = initialFocus === undefined ? popupRef : initialFocus;
  const setPopupElement = store.useStateSetter('popupElement');
  const state = {
    open,
    nested,
    transitionStatus,
    expanded: activeSnapPoint === 1,
    nestedDrawerOpen,
    nestedDrawerSwiping: nestedSwiping,
    swipeDirection,
    swiping
  };
  let popupHeightCssVarValue;
  const shouldUseAutoHeight = !hasNestedDrawer && transitionStatus !== 'ending';
  if (popupHeight && !shouldUseAutoHeight) {
    popupHeightCssVarValue = `${popupHeight}px`;
  }
  const shouldApplySnapPoints = snapPoints && snapPoints.length > 0 && (swipeDirection === 'down' || swipeDirection === 'up');
  let snapPointOffsetValue = null;
  if (shouldApplySnapPoints && activeSnapPointOffset !== null) {
    snapPointOffsetValue = swipeDirection === 'up' ? -activeSnapPointOffset : activeSnapPointOffset;
  }
  let dragStyles = swipe ? swipe.getDragStyles() : _empty.EMPTY_OBJECT;
  if (shouldApplySnapPoints && swipeDirection === 'down') {
    const baseOffset = activeSnapPointOffset ?? 0;
    const movementValue = Number.parseFloat(String(dragStyles[DrawerPopupCssVars.swipeMovementY]));
    if (swiping && Number.isFinite(movementValue)) {
      dragStyles = {
        ...dragStyles,
        transform: undefined,
        [DrawerPopupCssVars.swipeMovementY]: `${(0, _useDrawerSnapPoints.getSnapPointSwipeMovement)(baseOffset, movementValue)}px`
      };
    } else {
      dragStyles = {
        ...dragStyles,
        transform: undefined
      };
    }
  }
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    props: [rootPopupProps, {
      id: popupId,
      'aria-labelledby': titleElementId,
      'aria-describedby': descriptionElementId,
      role,
      ..._popups.FOCUSABLE_POPUP_PROPS,
      hidden: !mounted,
      onKeyDown(event) {
        if (_composite.COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }
      },
      style: {
        ...dragStyles,
        [DrawerBackdropCssVars.swipeProgress]: '0',
        [DrawerPopupCssVars.nestedDrawers]: nestedOpenDrawerCount,
        [DrawerPopupCssVars.height]: popupHeightCssVarValue,
        [DrawerPopupCssVars.snapPointOffset]: typeof snapPointOffsetValue === 'number' ? `${snapPointOffsetValue}px` : '0px',
        [DrawerPopupCssVars.frontmostHeight]: frontmostHeight ? `${frontmostHeight}px` : undefined,
        [DrawerPopupCssVars.swipeStrength]: typeof swipeStrength === 'number' && Number.isFinite(swipeStrength) && swipeStrength > 0 ? `${swipeStrength}` : '1'
      }
    }, elementProps],
    ref: [forwardedRef, popupRef, setPopupElement],
    stateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
    context: floatingRootContext,
    openInteractionType: openMethod,
    disabled: !mounted,
    closeOnFocusOut: !disablePointerDismissal,
    initialFocus: resolvedInitialFocus,
    returnFocus: finalFocus,
    modal: modal !== false,
    restoreFocus: "popup",
    children: element
  });
});
if (process.env.NODE_ENV !== "production") DrawerPopup.displayName = "DrawerPopup";