'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { CompositeRoot } from "../../internals/composite/root/CompositeRoot.mjs";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
import { useTabsRootContext } from "../root/TabsRootContext.mjs";
import { TabsListContext } from "./TabsListContext.mjs";

/**
 * Groups the individual tab buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const TabsList = /*#__PURE__*/React.forwardRef(function TabsList(componentProps, forwardedRef) {
  const {
    activateOnFocus = false,
    className,
    loopFocus = true,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    orientation,
    setTabMap,
    tabActivationDirection
  } = useTabsRootContext();
  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);
  const [tabsListElement, setTabsListElement] = React.useState(null);
  const indicatorUpdateListenersRef = React.useRef(new Set());
  const tabResizeObserverElementsRef = React.useRef(new Set());
  const resizeObserverRef = React.useRef(null);
  useIsoLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(() => {
      indicatorUpdateListenersRef.current.forEach(listener => {
        listener();
      });
    });
    resizeObserverRef.current = resizeObserver;
    if (tabsListElement) {
      resizeObserver.observe(tabsListElement);
    }
    tabResizeObserverElementsRef.current.forEach(element => {
      resizeObserver.observe(element);
    });
    return () => {
      resizeObserver.disconnect();
      resizeObserverRef.current = null;
    };
  }, [tabsListElement]);
  const registerIndicatorUpdateListener = useStableCallback(listener => {
    indicatorUpdateListenersRef.current.add(listener);
    return () => {
      indicatorUpdateListenersRef.current.delete(listener);
    };
  });
  const registerTabResizeObserverElement = useStableCallback(element => {
    tabResizeObserverElementsRef.current.add(element);
    resizeObserverRef.current?.observe(element);
    return () => {
      tabResizeObserverElementsRef.current.delete(element);
      resizeObserverRef.current?.unobserve(element);
    };
  });
  const state = {
    orientation,
    tabActivationDirection
  };
  const defaultProps = {
    'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
    role: 'tablist'
  };
  const tabsListContextValue = React.useMemo(() => ({
    activateOnFocus,
    registerIndicatorUpdateListener,
    registerTabResizeObserverElement,
    tabsListElement
  }), [activateOnFocus, registerIndicatorUpdateListener, registerTabResizeObserverElement, tabsListElement]);
  return /*#__PURE__*/_jsx(TabsListContext.Provider, {
    value: tabsListContextValue,
    children: /*#__PURE__*/_jsx(CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef, setTabsListElement],
      props: [defaultProps, elementProps],
      stateAttributesMapping: tabsStateAttributesMapping,
      highlightedIndex: highlightedTabIndex,
      enableHomeAndEndKeys: true,
      loopFocus: loopFocus,
      orientation: orientation,
      onHighlightedIndexChange: setHighlightedTabIndex,
      onMapChange: setTabMap,
      disabledIndices: EMPTY_ARRAY
    })
  });
});
if (process.env.NODE_ENV !== "production") TabsList.displayName = "TabsList";