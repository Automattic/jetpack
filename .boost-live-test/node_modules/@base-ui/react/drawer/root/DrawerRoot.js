"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerRoot = DrawerRoot;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _useControlled = require("@base-ui/utils/useControlled");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _owner = require("@base-ui/utils/owner");
var _platform = require("@base-ui/utils/platform");
var _DrawerRootContext = require("./DrawerRootContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _DialogRootContext = require("../../dialog/root/DialogRootContext");
var _useRenderDialogRoot = require("../../dialog/root/useRenderDialogRoot");
var _DrawerProviderContext = require("../provider/DrawerProviderContext");
var _jsxRuntime = require("react/jsx-runtime");
var _DrawerProviderReport, _DrawerProviderReport2;
/**
 * Groups all parts of the drawer.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
function DrawerRoot(props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    disablePointerDismissal = false,
    modal = true,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    swipeDirection = 'down',
    snapToSequentialPoints = false,
    snapPoints,
    snapPoint: snapPointProp,
    defaultSnapPoint,
    onSnapPointChange
  } = props;
  const parentDrawerRootContext = (0, _DrawerRootContext.useDrawerRootContext)(true);
  const notifyParentSwipeProgressChange = parentDrawerRootContext?.onNestedSwipeProgressChange;
  const notifyParentFrontmostHeight = parentDrawerRootContext?.onNestedFrontmostHeightChange;
  const notifyParentSwipingChange = parentDrawerRootContext?.onNestedSwipingChange;
  const notifyParentHasNestedDrawer = parentDrawerRootContext?.onNestedDrawerPresenceChange;
  const [popupHeight, setPopupHeight] = React.useState(0);
  const [frontmostHeight, setFrontmostHeight] = React.useState(0);
  const [hasNestedDrawer, setHasNestedDrawer] = React.useState(false);
  const [nestedSwiping, setNestedSwiping] = React.useState(false);
  const [nestedSwipeProgressStore] = React.useState(createNestedSwipeProgressStore);
  const resolvedDefaultSnapPoint = defaultSnapPoint !== undefined ? defaultSnapPoint : snapPoints?.[0] ?? null;
  const isSnapPointControlled = snapPointProp !== undefined;
  const [activeSnapPoint, setActiveSnapPointUnwrapped] = (0, _useControlled.useControlled)({
    controlled: snapPointProp,
    default: resolvedDefaultSnapPoint,
    name: 'Drawer',
    state: 'snapPoint'
  });
  const isNestedDrawerOpenRef = React.useRef(false);
  const swipeAreaActiveRef = React.useRef(false);
  const setActiveSnapPoint = (0, _useStableCallback.useStableCallback)((nextSnapPoint, eventDetails) => {
    const resolvedEventDetails = eventDetails ?? (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none);
    onSnapPointChange?.(nextSnapPoint, resolvedEventDetails);
    if (resolvedEventDetails.isCanceled) {
      return;
    }
    setActiveSnapPointUnwrapped(nextSnapPoint);
  });
  const resolvedActiveSnapPoint = React.useMemo(() => {
    if (isSnapPointControlled) {
      return activeSnapPoint;
    }
    if (!snapPoints || snapPoints.length === 0) {
      return activeSnapPoint;
    }
    if (activeSnapPoint === null || !snapPoints.some(snapPoint => Object.is(snapPoint, activeSnapPoint))) {
      return resolvedDefaultSnapPoint;
    }
    return activeSnapPoint;
  }, [activeSnapPoint, isSnapPointControlled, resolvedDefaultSnapPoint, snapPoints]);
  const onPopupHeightChange = (0, _useStableCallback.useStableCallback)(height => {
    setPopupHeight(height);
    if (!isNestedDrawerOpenRef.current && height > 0) {
      setFrontmostHeight(height);
    }
  });
  const onNestedFrontmostHeightChange = (0, _useStableCallback.useStableCallback)(height => {
    if (height > 0) {
      isNestedDrawerOpenRef.current = true;
      setFrontmostHeight(height);
      return;
    }
    isNestedDrawerOpenRef.current = false;
    if (popupHeight > 0) {
      setFrontmostHeight(popupHeight);
    }
  });
  const onNestedDrawerPresenceChange = (0, _useStableCallback.useStableCallback)(present => {
    setHasNestedDrawer(present);
  });
  const onNestedSwipeProgressChange = (0, _useStableCallback.useStableCallback)(progress => {
    nestedSwipeProgressStore.set(progress);
    notifyParentSwipeProgressChange?.(progress);
  });
  const onNestedSwipingChange = (0, _useStableCallback.useStableCallback)(swiping => {
    setNestedSwiping(swiping);
    notifyParentSwipingChange?.(swiping);
  });
  const handleOpenChange = (0, _useStableCallback.useStableCallback)((nextOpen, eventDetails) => {
    onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    if (!nextOpen && snapPoints && snapPoints.length > 0) {
      setActiveSnapPoint(resolvedDefaultSnapPoint, (0, _createBaseUIEventDetails.createChangeEventDetails)(eventDetails.reason, eventDetails.event, eventDetails.trigger));
    }
  });
  const contextValue = React.useMemo(() => ({
    swipeDirection,
    swipeAreaActiveRef,
    snapToSequentialPoints,
    snapPoints,
    activeSnapPoint: resolvedActiveSnapPoint,
    setActiveSnapPoint,
    frontmostHeight,
    popupHeight,
    hasNestedDrawer,
    nestedSwiping,
    nestedSwipeProgressStore,
    onNestedDrawerPresenceChange,
    onPopupHeightChange,
    onNestedFrontmostHeightChange,
    onNestedSwipingChange,
    onNestedSwipeProgressChange,
    notifyParentFrontmostHeight,
    notifyParentSwipingChange,
    notifyParentSwipeProgressChange,
    notifyParentHasNestedDrawer
  }), [resolvedActiveSnapPoint, frontmostHeight, hasNestedDrawer, nestedSwiping, nestedSwipeProgressStore, notifyParentHasNestedDrawer, notifyParentSwipeProgressChange, notifyParentSwipingChange, notifyParentFrontmostHeight, onNestedDrawerPresenceChange, onNestedFrontmostHeightChange, onNestedSwipeProgressChange, onNestedSwipingChange, onPopupHeightChange, popupHeight, setActiveSnapPoint, snapPoints, snapToSequentialPoints, swipeAreaActiveRef, swipeDirection]);
  const resolvedChildren = typeof children === 'function' ? payload => /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [_DrawerProviderReport || (_DrawerProviderReport = /*#__PURE__*/(0, _jsxRuntime.jsx)(DrawerProviderReporter, {})), children(payload)]
  }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [_DrawerProviderReport2 || (_DrawerProviderReport2 = /*#__PURE__*/(0, _jsxRuntime.jsx)(DrawerProviderReporter, {})), children]
  });
  const dialog = (0, _useRenderDialogRoot.useRenderDialogRoot)('drawer', {
    open: openProp,
    defaultOpen,
    onOpenChange: handleOpenChange,
    onOpenChangeComplete,
    disablePointerDismissal,
    modal,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp,
    children: resolvedChildren
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawerRootContext.DrawerRootContext.Provider, {
    value: contextValue,
    children: dialog
  });
}
function createNestedSwipeProgressStore() {
  let progress = 0;
  const listeners = new Set();
  return {
    getSnapshot: () => progress,
    set(nextProgress) {
      const resolved = Number.isFinite(nextProgress) ? nextProgress : 0;
      if (resolved === progress) {
        return;
      }
      progress = resolved;
      listeners.forEach(listener => {
        listener();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
function DrawerProviderReporter() {
  const providerContext = (0, _DrawerProviderContext.useDrawerProviderContext)();
  const store = (0, _DialogRootContext.useDialogRootContext)(false);
  const setDrawerOpen = providerContext?.setDrawerOpen;
  const removeDrawer = providerContext?.removeDrawer;
  const open = store.useState('open');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const popupElement = store.useState('popupElement');
  const isTopmost = nestedOpenDialogCount === 0;
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!removeDrawer) {
      return undefined;
    }
    return () => {
      removeDrawer(store);
    };
  }, [removeDrawer, store]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setDrawerOpen?.(store, open);
  }, [open, setDrawerOpen, store]);
  React.useEffect(() => {
    // CloseWatcher enables the Android back gesture (Chromium-only).
    // Keep this Android-only for now to avoid interfering with Escape/nesting semantics on desktop due to `useDismiss`.
    if (!open || !isTopmost || !_platform.platform.os.android) {
      return undefined;
    }
    const win = (0, _owner.ownerWindow)(popupElement);
    const CloseWatcherCtor = win.CloseWatcher;
    if (!CloseWatcherCtor) {
      return undefined;
    }
    function handleCloseWatcher(event) {
      if (!store.select('open')) {
        return;
      }
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.closeWatcher, event));
    }
    const closeWatcher = new CloseWatcherCtor();
    const unsubscribe = (0, _addEventListener.addEventListener)(closeWatcher, 'close', handleCloseWatcher);
    return () => {
      unsubscribe();
      closeWatcher.destroy();
    };
  }, [store, isTopmost, open, popupElement]);
  return null;
}