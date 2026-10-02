"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabsList = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _empty = require("@base-ui/utils/empty");
var _CompositeRoot = require("../../internals/composite/root/CompositeRoot");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
var _TabsRootContext = require("../root/TabsRootContext");
var _TabsListContext = require("./TabsListContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups the individual tab buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
const TabsList = exports.TabsList = /*#__PURE__*/React.forwardRef(function TabsList(componentProps, forwardedRef) {
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
  } = (0, _TabsRootContext.useTabsRootContext)();
  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);
  const [tabsListElement, setTabsListElement] = React.useState(null);
  const indicatorUpdateListenersRef = React.useRef(new Set());
  const tabResizeObserverElementsRef = React.useRef(new Set());
  const resizeObserverRef = React.useRef(null);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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
  const registerIndicatorUpdateListener = (0, _useStableCallback.useStableCallback)(listener => {
    indicatorUpdateListenersRef.current.add(listener);
    return () => {
      indicatorUpdateListenersRef.current.delete(listener);
    };
  });
  const registerTabResizeObserverElement = (0, _useStableCallback.useStableCallback)(element => {
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
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TabsListContext.TabsListContext.Provider, {
    value: tabsListContextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef, setTabsListElement],
      props: [defaultProps, elementProps],
      stateAttributesMapping: _stateAttributesMapping.tabsStateAttributesMapping,
      highlightedIndex: highlightedTabIndex,
      enableHomeAndEndKeys: true,
      loopFocus: loopFocus,
      orientation: orientation,
      onHighlightedIndexChange: setHighlightedTabIndex,
      onMapChange: setTabMap,
      disabledIndices: _empty.EMPTY_ARRAY
    })
  });
});
if (process.env.NODE_ENV !== "production") TabsList.displayName = "TabsList";