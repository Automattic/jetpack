// packages/components/src/tab-panel/index.tsx
import * as Ariakit from "@ariakit/react";
import clsx from "clsx";
import { forwardRef, useEffect, useLayoutEffect, useCallback } from "@wordpress/element";
import { useInstanceId, usePrevious } from "@wordpress/compose";
import { isRTL } from "@wordpress/i18n";
import Button from "../button/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var extractTabName = (id) => {
  if (typeof id === "undefined" || id === null) {
    return;
  }
  return id.match(/^tab-panel-[0-9]*-(.*)/)?.[1];
};
var UnforwardedTabPanel = ({
  className,
  children,
  tabs,
  selectOnMove = true,
  initialTabName,
  orientation = "horizontal",
  activeClass = "is-active",
  onSelect
}, ref) => {
  const instanceId = useInstanceId(TabPanel2, "tab-panel");
  const prependInstanceId = useCallback((tabName) => {
    if (typeof tabName === "undefined") {
      return;
    }
    return `${instanceId}-${tabName}`;
  }, [instanceId]);
  const tabStore = Ariakit.useTabStore({
    setSelectedId: (newTabValue) => {
      if (typeof newTabValue === "undefined" || newTabValue === null) {
        return;
      }
      const newTab = tabs.find((t) => prependInstanceId(t.name) === newTabValue);
      if (newTab?.disabled || newTab === selectedTab) {
        return;
      }
      const simplifiedTabName = extractTabName(newTabValue);
      if (typeof simplifiedTabName === "undefined") {
        return;
      }
      onSelect?.(simplifiedTabName);
    },
    orientation,
    selectOnMove,
    defaultSelectedId: prependInstanceId(initialTabName),
    rtl: isRTL()
  });
  const selectedTabName = extractTabName(Ariakit.useStoreState(tabStore, "selectedId"));
  const setTabStoreSelectedId = useCallback((tabName) => {
    tabStore.setState("selectedId", prependInstanceId(tabName));
  }, [prependInstanceId, tabStore]);
  const selectedTab = tabs.find(({
    name
  }) => name === selectedTabName);
  const previousSelectedTabName = usePrevious(selectedTabName);
  useEffect(() => {
    if (previousSelectedTabName !== selectedTabName && selectedTabName === initialTabName && !!selectedTabName) {
      onSelect?.(selectedTabName);
    }
  }, [selectedTabName, initialTabName, onSelect, previousSelectedTabName]);
  useLayoutEffect(() => {
    if (selectedTab) {
      return;
    }
    const initialTab = tabs.find((tab) => tab.name === initialTabName);
    if (initialTabName && !initialTab) {
      return;
    }
    if (initialTab && !initialTab.disabled) {
      setTabStoreSelectedId(initialTab.name);
    } else {
      const firstEnabledTab = tabs.find((tab) => !tab.disabled);
      if (firstEnabledTab) {
        setTabStoreSelectedId(firstEnabledTab.name);
      }
    }
  }, [tabs, selectedTab, initialTabName, instanceId, setTabStoreSelectedId]);
  useEffect(() => {
    if (!selectedTab?.disabled) {
      return;
    }
    const firstEnabledTab = tabs.find((tab) => !tab.disabled);
    if (firstEnabledTab) {
      setTabStoreSelectedId(firstEnabledTab.name);
    }
  }, [tabs, selectedTab?.disabled, setTabStoreSelectedId, instanceId]);
  return /* @__PURE__ */ _jsxs("div", {
    className,
    ref,
    children: [/* @__PURE__ */ _jsx(Ariakit.TabList, {
      store: tabStore,
      className: "components-tab-panel__tabs",
      children: tabs.map((tab) => {
        return /* @__PURE__ */ _jsx(Ariakit.Tab, {
          id: prependInstanceId(tab.name),
          className: clsx("components-tab-panel__tabs-item", tab.className, {
            [activeClass]: tab.name === selectedTabName
          }),
          disabled: tab.disabled,
          "aria-controls": `${prependInstanceId(tab.name)}-view`,
          render: /* @__PURE__ */ _jsx(Button, {
            __next40pxDefaultSize: true,
            icon: tab.icon,
            label: tab.icon && tab.title,
            showTooltip: !!tab.icon
          }),
          children: !tab.icon && tab.title
        }, tab.name);
      })
    }), selectedTab && /* @__PURE__ */ _jsx(Ariakit.TabPanel, {
      id: `${prependInstanceId(selectedTab.name)}-view`,
      store: tabStore,
      tabId: prependInstanceId(selectedTab.name),
      className: "components-tab-panel__tab-content",
      children: children(selectedTab)
    })]
  });
};
var TabPanel2 = forwardRef(UnforwardedTabPanel);
TabPanel2.displayName = "TabPanel";
var tab_panel_default = TabPanel2;
export {
  TabPanel2 as TabPanel,
  tab_panel_default as default
};
//# sourceMappingURL=index.mjs.map
