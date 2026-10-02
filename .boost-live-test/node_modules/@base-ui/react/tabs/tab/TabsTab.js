"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TabsTab = void 0;
var React = _interopRequireWildcard(require("react"));
var _owner = require("@base-ui/utils/owner");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useRenderElement = require("../../internals/useRenderElement");
var _useButton = require("../../internals/use-button");
var _constants = require("../../internals/composite/constants");
var _useCompositeItem = require("../../internals/composite/item/useCompositeItem");
var _CompositeRootContext = require("../../internals/composite/root/CompositeRootContext");
var _TabsRootContext = require("../root/TabsRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
var _TabsListContext = require("../list/TabsListContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _utils = require("../../floating-ui-react/utils");
/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
const TabsTab = exports.TabsTab = /*#__PURE__*/React.forwardRef(function TabsTab(componentProps, forwardedRef) {
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
  } = (0, _TabsRootContext.useTabsRootContext)();
  const {
    activateOnFocus,
    registerTabResizeObserverElement,
    tabsListElement
  } = (0, _TabsListContext.useTabsListContext)();
  const {
    highlightedIndex,
    onHighlightedIndexChange
  } = (0, _CompositeRootContext.useCompositeRootContext)();
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
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
  } = (0, _useCompositeItem.useCompositeItem)({
    metadata: tabMetadata
  });
  const active = value === activeTabValue;
  const isNavigatingRef = React.useRef(false);
  const unobserveTabElementRef = React.useRef(null);

  // Registered from the ref callback rather than an effect so the observer
  // follows the rendered element when the `render` prop swaps the host element.
  const observeTabElement = (0, _useStableCallback.useStableCallback)(element => {
    unobserveTabElementRef.current?.();
    unobserveTabElementRef.current = element ? registerTabResizeObserverElement(element) : null;
  });

  // Keep the highlighted item in sync with the currently active tab
  // when the value prop changes externally (controlled mode)
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
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
      const activeEl = (0, _utils.activeElement)((0, _owner.ownerDocument)(listElement));
      if (activeEl && (0, _utils.contains)(listElement, activeEl)) {
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
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true
  });
  const tabPanelId = getTabPanelIdByValue(value);
  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  // Both callers guard on `!active`, so the current value is never re-committed.
  function activate(event) {
    onValueChange(value, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent, undefined, {
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
    const doc = (0, _owner.ownerDocument)(event.currentTarget);
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
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
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
      [_constants.ACTIVE_COMPOSITE_ITEM]: active ? '' : undefined,
      onKeyDownCapture() {
        isNavigatingRef.current = true;
      }
    }, elementProps, getButtonProps],
    stateAttributesMapping: _stateAttributesMapping.tabsStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") TabsTab.displayName = "TabsTab";