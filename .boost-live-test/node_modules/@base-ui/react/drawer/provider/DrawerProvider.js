"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerProvider = DrawerProvider;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _DrawerProviderContext = require("./DrawerProviderContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Provides a shared context for coordinating global Drawer UI, such as indent/background effects based on whether any Drawer is open.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
function DrawerProvider(props) {
  const {
    children
  } = props;
  const [openDrawers, setOpenDrawers] = React.useState(() => new Set());
  const [visualStateStore] = React.useState(createVisualStateStore);
  const setDrawerOpen = (0, _useStableCallback.useStableCallback)((drawer, open) => {
    setOpenDrawers(prev => {
      if (prev.has(drawer) === open) {
        return prev;
      }
      const next = new Set(prev);
      if (open) {
        next.add(drawer);
      } else {
        next.delete(drawer);
      }
      return next;
    });
  });
  const removeDrawer = (0, _useStableCallback.useStableCallback)(drawer => {
    setDrawerOpen(drawer, false);
  });
  const active = openDrawers.size > 0;
  const contextValue = React.useMemo(() => ({
    setDrawerOpen,
    removeDrawer,
    active,
    visualStateStore
  }), [active, removeDrawer, setDrawerOpen, visualStateStore]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawerProviderContext.DrawerProviderContext.Provider, {
    value: contextValue,
    children: children
  });
}
function createVisualStateStore() {
  let state = {
    swipeProgress: 0,
    frontmostHeight: 0
  };
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    set(nextState) {
      let nextSwipeProgress = state.swipeProgress;
      if (nextState.swipeProgress !== undefined) {
        nextSwipeProgress = Number.isFinite(nextState.swipeProgress) ? nextState.swipeProgress : 0;
      }
      let nextFrontmostHeight = state.frontmostHeight;
      if (nextState.frontmostHeight !== undefined) {
        nextFrontmostHeight = Number.isFinite(nextState.frontmostHeight) ? nextState.frontmostHeight : 0;
      }
      if (nextSwipeProgress === state.swipeProgress && nextFrontmostHeight === state.frontmostHeight) {
        return;
      }
      state = {
        swipeProgress: nextSwipeProgress,
        frontmostHeight: nextFrontmostHeight
      };
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