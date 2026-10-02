'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { CompositeList } from "../../internals/composite/list/CompositeList.mjs";
import { TabsRootContext } from "./TabsRootContext.mjs";
import { tabsStateAttributesMapping } from "./stateAttributesMapping.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const TabsRoot = /*#__PURE__*/React.forwardRef(function TabsRoot(componentProps, forwardedRef) {
  const {
    className,
    defaultValue: defaultValueProp = 0,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;

  // Track whether the user explicitly provided a defined `defaultValue` prop.
  // Used to determine if we should honor a disabled tab selection.
  const hasExplicitDefaultValueProp = componentProps.defaultValue !== undefined;
  const tabPanelRefs = React.useRef([]);
  const [mountedTabPanels, setMountedTabPanels] = React.useState(() => new Map());
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValueProp,
    name: 'Tabs',
    state: 'value'
  });
  const isControlled = valueProp !== undefined;
  const [tabMap, setTabMap] = React.useState(() => new Map());
  const lastKnownTabElementRef = React.useRef(undefined);

  // Used for activation direction detection via tab element positions.
  const getTabElementBySelectedValue = React.useCallback(selectedValue => findTabElement(tabMap, selectedValue), [tabMap]);
  const [activationDirectionState, setActivationDirectionState] = React.useState(() => ({
    previousValue: value,
    tabActivationDirection: 'none'
  }));
  const {
    previousValue,
    tabActivationDirection: committedTabActivationDirection
  } = activationDirectionState;
  let tabActivationDirection = committedTabActivationDirection;
  let directionComputationIncomplete = false;

  // Compute activation direction during render when value changes so children see
  // the correct direction on their very first render after the selection update.
  // The previous value snapshot is stored in state and synced after commit.
  // https://github.com/mui/base-ui/issues/3873
  if (previousValue !== value) {
    tabActivationDirection = computeActivationDirection(previousValue, value, orientation, tabMap);

    // When a new tab is added and selected in the same controlled update,
    // the tab element may not yet be registered in tabMap, so direction was
    // computed from a value-based fallback. Keep the previous value snapshot
    // stale so we re-compute from DOM positions once tabMap is up to date.
    directionComputationIncomplete = previousValue != null && value != null && getTabElementBySelectedValue(value) == null;
  }
  const nextPreviousValue = directionComputationIncomplete ? previousValue : value;
  const shouldSyncActivationDirectionState = previousValue !== nextPreviousValue || committedTabActivationDirection !== tabActivationDirection;
  useIsoLayoutEffect(() => {
    if (!shouldSyncActivationDirectionState) {
      return;
    }
    setActivationDirectionState({
      previousValue: nextPreviousValue,
      tabActivationDirection
    });
  }, [nextPreviousValue, shouldSyncActivationDirectionState, tabActivationDirection]);
  const onValueChange = useStableCallback((newValue, eventDetails) => {
    const activationDirection = computeActivationDirection(value, newValue, orientation, tabMap);
    eventDetails.activationDirection = activationDirection;
    onValueChangeProp?.(newValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValue(newValue);
  });
  const notifyAutomaticValueChange = useStableCallback((nextValue, reason) => {
    onValueChangeProp?.(nextValue, createChangeEventDetails(reason, undefined, undefined, {
      activationDirection: 'none'
    }));
  });
  const registerMountedTabPanel = useStableCallback((panelValue, panelId) => {
    setMountedTabPanels(prev => {
      const next = new Map(prev);
      next.set(panelValue, panelId);
      return next;
    });
    return () => {
      setMountedTabPanels(prev => {
        // Another panel with the same value took ownership in the meantime;
        // leave its registration in place.
        if (prev.get(panelValue) !== panelId) {
          return prev;
        }
        const next = new Map(prev);
        next.delete(panelValue);
        return next;
      });
    };
  });

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByValue = React.useCallback(tabValue => {
    return mountedTabPanels.get(tabValue);
  }, [mountedTabPanels]);

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValue = React.useCallback(tabPanelValue => {
    for (const tabMetadata of tabMap.values()) {
      if (tabPanelValue === tabMetadata.value) {
        return tabMetadata.id;
      }
    }
    return undefined;
  }, [tabMap]);
  const tabsContextValue = React.useMemo(() => ({
    getTabElementBySelectedValue,
    getTabIdByPanelValue,
    getTabPanelIdByValue,
    onValueChange,
    orientation,
    registerMountedTabPanel,
    setTabMap,
    tabActivationDirection,
    value
  }), [getTabElementBySelectedValue, getTabIdByPanelValue, getTabPanelIdByValue, onValueChange, orientation, registerMountedTabPanel, setTabMap, tabActivationDirection, value]);
  const selectedTabMetadata = React.useMemo(() => {
    for (const tabMetadata of tabMap.values()) {
      if (tabMetadata.value === value) {
        return tabMetadata;
      }
    }
    return undefined;
  }, [tabMap, value]);

  // Find the first non-disabled tab value.
  // Used as a fallback when the current selection is disabled or missing.
  const firstEnabledTabValue = React.useMemo(() => {
    for (const tabMetadata of tabMap.values()) {
      if (!tabMetadata.disabled) {
        return tabMetadata.value;
      }
    }
    return undefined;
  }, [tabMap]);

  // Implicit uncontrolled selections are still automatic changes, so notify
  // once when the tabs first register. Explicit defaults are treated as user-owned.
  const shouldNotifyInitialValueChangeRef = React.useRef(!hasExplicitDefaultValueProp);
  // useControlled warns if defaultValue changes after mount, but the
  // disabled-default honor policy below still needs a stable initial value.
  const initialDefaultValueRef = React.useRef(defaultValueProp);
  // An explicit defaultValue can intentionally point at a disabled tab on mount.
  // Once that selection becomes valid, later disabled states should fall back.
  const shouldHonorDisabledDefaultValueRef = React.useRef(hasExplicitDefaultValueProp);
  const didRegisterTabsRef = React.useRef(false);

  // Uncontrolled roots own automatic fallback. Controlled roots keep the exact
  // value supplied by the parent, even when that tab is disabled or missing.
  useIsoLayoutEffect(() => {
    if (isControlled) {
      return;
    }
    function commitAutomaticValueChange(fallbackValue, fallbackReason) {
      setValue(fallbackValue);
      // Automatic fallbacks are not directional transitions; reset the direction
      // alongside the value so the batched commit keeps both in sync.
      setActivationDirectionState({
        previousValue: fallbackValue,
        tabActivationDirection: 'none'
      });
      notifyAutomaticValueChange(fallbackValue, fallbackReason);
      // Mark the initial notification as delivered only after the consumer
      // callback returns. The fallback value is queued first so automatic
      // consistency updates are not cancelable through a throwing handler.
      shouldNotifyInitialValueChangeRef.current = false;
    }
    if (tabMap.size === 0) {
      // A Suspense boundary outside the root can clean up layout effects while
      // keeping the previous tabs connected. Don't treat that as removal.
      if (didRegisterTabsRef.current && value !== null && !lastKnownTabElementRef.current?.isConnected) {
        commitAutomaticValueChange(null, REASONS.missing);
      }
      return;
    }
    didRegisterTabsRef.current = true;
    lastKnownTabElementRef.current = tabMap.keys().next().value;
    const selectionIsDisabled = selectedTabMetadata?.disabled;
    const selectionIsMissing = selectedTabMetadata == null && value !== null;
    if (!selectionIsDisabled && value === initialDefaultValueRef.current) {
      shouldHonorDisabledDefaultValueRef.current = false;
    }
    if (shouldHonorDisabledDefaultValueRef.current && selectionIsDisabled && value === initialDefaultValueRef.current) {
      return;
    }
    const shouldNotifyInitialValueChange = shouldNotifyInitialValueChangeRef.current;
    if (selectionIsDisabled || selectionIsMissing) {
      const fallbackValue = firstEnabledTabValue ?? null;
      if (value === fallbackValue) {
        // Already at the fallback value; no commit or notification needed,
        // but record that the implicit-initial transition has resolved.
        shouldNotifyInitialValueChangeRef.current = false;
        return;
      }
      let fallbackReason = REASONS.missing;
      if (shouldNotifyInitialValueChange) {
        fallbackReason = REASONS.initial;
      } else if (selectionIsDisabled) {
        fallbackReason = REASONS.disabled;
      }
      commitAutomaticValueChange(fallbackValue, fallbackReason);
      return;
    }
    if (shouldNotifyInitialValueChange && selectedTabMetadata != null) {
      notifyAutomaticValueChange(value, REASONS.initial);
      shouldNotifyInitialValueChangeRef.current = false;
    }
  }, [firstEnabledTabValue, isControlled, notifyAutomaticValueChange, selectedTabMetadata, setValue, tabMap, value]);
  const state = {
    orientation,
    tabActivationDirection
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: tabsStateAttributesMapping
  });
  return /*#__PURE__*/_jsx(TabsRootContext.Provider, {
    value: tabsContextValue,
    children: /*#__PURE__*/_jsx(CompositeList, {
      elementsRef: tabPanelRefs,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") TabsRoot.displayName = "TabsRoot";
function findTabElement(tabMap, value) {
  for (const [tabElement, tabMetadata] of tabMap.entries()) {
    if (value === tabMetadata.value) {
      return tabElement;
    }
  }
  return null;
}
function computeActivationDirection(oldValue, newValue, orientation, tabMap) {
  if (oldValue == null || newValue == null) {
    return 'none';
  }
  const [positionProp, backward, forward] = orientation === 'horizontal' ? ['left', 'left', 'right'] : ['top', 'up', 'down'];
  const oldTab = findTabElement(tabMap, oldValue);
  const newTab = findTabElement(tabMap, newValue);
  if (oldTab == null || newTab == null) {
    // Fallback for dynamic tabs: when a tab element isn't registered yet
    // (e.g. added and selected in the same update), infer direction from
    // the values themselves. Works for comparable types (numbers, strings).
    if (oldTab !== newTab && (typeof oldValue === 'number' || typeof oldValue === 'string') && typeof oldValue === typeof newValue) {
      return newValue > oldValue ? forward : backward;
    }
    return 'none';
  }
  const oldPosition = oldTab.getBoundingClientRect()[positionProp];
  const newPosition = newTab.getBoundingClientRect()[positionProp];
  if (newPosition < oldPosition) {
    return backward;
  }
  if (newPosition > oldPosition) {
    return forward;
  }
  return 'none';
}