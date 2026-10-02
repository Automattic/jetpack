'use client';

import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { ACTIVE_COMPOSITE_ITEM } from "../../internals/composite/constants.mjs";
import { useCompositeItem } from "../../internals/composite/item/useCompositeItem.mjs";
import { useCompositeRootContext } from "../../internals/composite/root/CompositeRootContext.mjs";
import { useTabsRootContext } from "../root/TabsRootContext.mjs";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
import { useTabsListContext } from "../list/TabsListContext.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { activeElement, contains } from "../../floating-ui-react/utils.mjs";

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsTab = /*#__PURE__*/React.forwardRef(function TabsTab(componentProps, forwardedRef) {
  const {
    className,
    disabled = false,
    render,
    value,
    id: idProp,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    value: activeTabValue,
    getTabPanelIdByValue,
    onValueChange,
    orientation,
    tabActivationDirection
  } = useTabsRootContext();
  const {
    activateOnFocus,
    registerTabResizeObserverElement,
    tabsListElement
  } = useTabsListContext();
  const {
    highlightedIndex,
    onHighlightedIndexChange
  } = useCompositeRootContext();
  const id = useBaseUiId(idProp);
  const tabMetadata = React.useMemo(() => ({
    disabled,
    id,
    value
  }), [disabled, id, value]);
  const {
    compositeProps,
    compositeRef,
    index
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem({
    metadata: tabMetadata
  });
  const active = value === activeTabValue;
  const isNavigatingRef = React.useRef(false);
  const unobserveTabElementRef = React.useRef(null);

  // Registered from the ref callback rather than an effect so the observer
  // follows the rendered element when the `render` prop swaps the host element.
  const observeTabElement = useStableCallback(element => {
    unobserveTabElementRef.current?.();
    unobserveTabElementRef.current = element ? registerTabResizeObserverElement(element) : null;
  });

  // Keep the highlighted item in sync with the currently active tab
  // when the value prop changes externally (controlled mode)
  useIsoLayoutEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    if (!(active && index > -1 && highlightedIndex !== index)) {
      return;
    }

    // If focus is currently within the tabs list, don't override the roving
    // focus highlight. This keeps keyboard navigation relative to the focused
    // item after an external/asynchronous selection change.
    const listElement = tabsListElement;
    if (listElement != null) {
      const activeEl = activeElement(ownerDocument(listElement));
      if (activeEl && contains(listElement, activeEl)) {
        return;
      }
    }

    // Don't highlight disabled tabs to prevent them from interfering with keyboard navigation.
    // Keyboard focus (tabIndex) should remain on an enabled tab even when a disabled tab is selected.
    if (!disabled) {
      onHighlightedIndexChange(index);
    }
  }, [active, index, highlightedIndex, onHighlightedIndexChange, disabled, tabsListElement]);
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true
  });
  const tabPanelId = getTabPanelIdByValue(value);
  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  // Both callers guard on `!active`, so the current value is never re-committed.
  function activate(event) {
    onValueChange(value, createChangeEventDetails(REASONS.none, event.nativeEvent, undefined, {
      activationDirection: 'none'
    }));
  }
  function onClick(event) {
    if (active || disabled) {
      return;
    }
    activate(event);
  }
  function onFocus(event) {
    if (active || disabled) {
      return;
    }
    if (activateOnFocus && (!isPressingRef.current ||
    // keyboard or touch focus
    isMainButtonRef.current) // main mouse button focus
    ) {
      activate(event);
    }
  }
  function onPointerDown(event) {
    if (active || disabled) {
      return;
    }
    isPressingRef.current = true;
    // Secondary presses (context menu, middle click) may focus the tab, but
    // must not activate it with `activateOnFocus`.
    isMainButtonRef.current = event.button === 0;

    // Registered for every button so a secondary press doesn't leave the tab
    // stuck in the pressing state, which would suppress later focus activation.
    const doc = ownerDocument(event.currentTarget);
    function handlePointerEnd() {
      isPressingRef.current = false;
      isMainButtonRef.current = false;
      doc.removeEventListener('pointerup', handlePointerEnd);
      doc.removeEventListener('pointercancel', handlePointerEnd);
    }
    doc.addEventListener('pointerup', handlePointerEnd);
    doc.addEventListener('pointercancel', handlePointerEnd);
  }
  const state = {
    disabled,
    active,
    orientation,
    tabActivationDirection
  };
  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, compositeRef, observeTabElement],
    props: [compositeProps, {
      role: 'tab',
      'aria-controls': tabPanelId,
      'aria-selected': active,
      id,
      onClick,
      onFocus,
      onPointerDown,
      [ACTIVE_COMPOSITE_ITEM]: active ? '' : undefined,
      onKeyDownCapture() {
        isNavigatingRef.current = true;
      }
    }, elementProps, getButtonProps],
    stateAttributesMapping: tabsStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") TabsTab.displayName = "TabsTab";