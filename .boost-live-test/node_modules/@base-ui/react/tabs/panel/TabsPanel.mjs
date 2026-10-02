'use client';

import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useCompositeListItem } from "../../internals/composite/list/useCompositeListItem.mjs";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
import { useTabsRootContext } from "../root/TabsRootContext.mjs";
import * as TabsPanelDataAttributes from "./TabsPanelDataAttributes.mjs";
const stateAttributesMapping = {
  ...tabsStateAttributesMapping,
  ...transitionStatusMapping
};

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsPanel = /*#__PURE__*/React.forwardRef(function TabsPanel(componentProps, forwardedRef) {
  const {
    className,
    value,
    render,
    keepMounted = false,
    style,
    ...elementProps
  } = componentProps;
  const {
    value: selectedValue,
    getTabIdByPanelValue,
    orientation,
    tabActivationDirection,
    registerMountedTabPanel
  } = useTabsRootContext();
  const id = useBaseUiId();
  const {
    ref: listItemRef,
    index
  } = useCompositeListItem();
  const open = value === selectedValue;
  const {
    mounted,
    transitionStatus,
    setMounted
  } = useTransitionStatus(open);
  const hidden = !mounted;
  const correspondingTabId = getTabIdByPanelValue(value);
  const state = {
    hidden,
    orientation,
    tabActivationDirection,
    transitionStatus
  };
  const panelRef = React.useRef(null);
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef, panelRef],
    props: [{
      'aria-labelledby': correspondingTabId,
      hidden,
      id,
      role: 'tabpanel',
      tabIndex: open ? 0 : -1,
      inert: inertValue(!open),
      // Computed key: a plain literal key fails the DOM-props excess property check.
      [TabsPanelDataAttributes.index]: index
    }, elementProps],
    stateAttributesMapping
  });
  useOpenChangeComplete({
    open,
    ref: panelRef,
    onComplete() {
      if (!open) {
        setMounted(false);
      }
    }
  });
  useIsoLayoutEffect(() => {
    // On React 17 `useId` resolves in a passive effect, so `id` is still
    // undefined during this layout effect on the first commit. Skip the
    // registration until the effect re-runs with the resolved id.
    if (id == null || hidden && !keepMounted) {
      return undefined;
    }
    return registerMountedTabPanel(value, id);
  }, [hidden, keepMounted, value, id, registerMountedTabPanel]);
  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") TabsPanel.displayName = "TabsPanel";