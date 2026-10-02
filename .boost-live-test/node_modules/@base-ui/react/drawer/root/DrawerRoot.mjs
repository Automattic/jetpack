'use client';

var _DrawerProviderReport, _DrawerProviderReport2;
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerWindow } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import { DrawerRootContext, useDrawerRootContext } from "./DrawerRootContext.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useDialogRootContext } from "../../dialog/root/DialogRootContext.mjs";
import { useRenderDialogRoot } from "../../dialog/root/useRenderDialogRoot.mjs";
import { useDrawerProviderContext } from "../provider/DrawerProviderContext.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Groups all parts of the drawer.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export function DrawerRoot(props) {
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
  const parentDrawerRootContext = useDrawerRootContext(true);
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
  const [activeSnapPoint, setActiveSnapPointUnwrapped] = useControlled({
    controlled: snapPointProp,
    default: resolvedDefaultSnapPoint,
    name: 'Drawer',
    state: 'snapPoint'
  });
  const isNestedDrawerOpenRef = React.useRef(false);
  const swipeAreaActiveRef = React.useRef(false);
  const setActiveSnapPoint = useStableCallback((nextSnapPoint, eventDetails) => {
    const resolvedEventDetails = eventDetails ?? createChangeEventDetails(REASONS.none);
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
  const onPopupHeightChange = useStableCallback(height => {
    setPopupHeight(height);
    if (!isNestedDrawerOpenRef.current && height > 0) {
      setFrontmostHeight(height);
    }
  });
  const onNestedFrontmostHeightChange = useStableCallback(height => {
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
  const onNestedDrawerPresenceChange = useStableCallback(present => {
    setHasNestedDrawer(present);
  });
  const onNestedSwipeProgressChange = useStableCallback(progress => {
    nestedSwipeProgressStore.set(progress);
    notifyParentSwipeProgressChange?.(progress);
  });
  const onNestedSwipingChange = useStableCallback(swiping => {
    setNestedSwiping(swiping);
    notifyParentSwipingChange?.(swiping);
  });
  const handleOpenChange = useStableCallback((nextOpen, eventDetails) => {
    onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    if (!nextOpen && snapPoints && snapPoints.length > 0) {
      setActiveSnapPoint(resolvedDefaultSnapPoint, createChangeEventDetails(eventDetails.reason, eventDetails.event, eventDetails.trigger));
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
  const resolvedChildren = typeof children === 'function' ? payload => /*#__PURE__*/_jsxs(React.Fragment, {
    children: [_DrawerProviderReport || (_DrawerProviderReport = /*#__PURE__*/_jsx(DrawerProviderReporter, {})), children(payload)]
  }) : /*#__PURE__*/_jsxs(React.Fragment, {
    children: [_DrawerProviderReport2 || (_DrawerProviderReport2 = /*#__PURE__*/_jsx(DrawerProviderReporter, {})), children]
  });
  const dialog = useRenderDialogRoot('drawer', {
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
  return /*#__PURE__*/_jsx(DrawerRootContext.Provider, {
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
  const providerContext = useDrawerProviderContext();
  const store = useDialogRootContext(false);
  const setDrawerOpen = providerContext?.setDrawerOpen;
  const removeDrawer = providerContext?.removeDrawer;
  const open = store.useState('open');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const popupElement = store.useState('popupElement');
  const isTopmost = nestedOpenDialogCount === 0;
  useIsoLayoutEffect(() => {
    if (!removeDrawer) {
      return undefined;
    }
    return () => {
      removeDrawer(store);
    };
  }, [removeDrawer, store]);
  useIsoLayoutEffect(() => {
    setDrawerOpen?.(store, open);
  }, [open, setDrawerOpen, store]);
  React.useEffect(() => {
    // CloseWatcher enables the Android back gesture (Chromium-only).
    // Keep this Android-only for now to avoid interfering with Escape/nesting semantics on desktop due to `useDismiss`.
    if (!open || !isTopmost || !platform.os.android) {
      return undefined;
    }
    const win = ownerWindow(popupElement);
    const CloseWatcherCtor = win.CloseWatcher;
    if (!CloseWatcherCtor) {
      return undefined;
    }
    function handleCloseWatcher(event) {
      if (!store.select('open')) {
        return;
      }
      store.setOpen(false, createChangeEventDetails(REASONS.closeWatcher, event));
    }
    const closeWatcher = new CloseWatcherCtor();
    const unsubscribe = addEventListener(closeWatcher, 'close', handleCloseWatcher);
    return () => {
      unsubscribe();
      closeWatcher.destroy();
    };
  }, [store, isTopmost, open, popupElement]);
  return null;
}