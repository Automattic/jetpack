"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxList = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _ComboboxPositionerContext = require("../positioner/ComboboxPositionerContext");
var _ComboboxCollection2 = require("../collection/ComboboxCollection");
var _CompositeList = require("../../internals/composite/list/CompositeList");
var _utils = require("../../floating-ui-react/utils");
var _parts = require("../utils/parts");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A list container for the items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxList = exports.ComboboxList = /*#__PURE__*/React.forwardRef(function ComboboxList(componentProps, forwardedRef) {
  var _ComboboxCollection;
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const floatingRootContext = (0, _ComboboxRootContext.useComboboxFloatingContext)();
  const hasPositionerContext = Boolean((0, _ComboboxPositionerContext.useComboboxPositionerContext)(true));
  const {
    filteredItems,
    hasItems
  } = (0, _ComboboxRootContext.useComboboxDerivedItemsContext)();
  const selectionMode = store.useState('selectionMode');
  const grid = store.useState('grid');
  const readOnly = store.useState('readOnly');
  const listProps = store.useState('listProps');
  const virtualized = store.useState('virtualized');
  const forceMounted = store.useState('forceMounted');
  const multiple = selectionMode === 'multiple';
  const empty = filteredItems.length === 0;
  const setPositionerElement = (0, _useStableCallback.useStableCallback)(element => {
    store.set('positionerElement', element);
  });
  const setListElement = (0, _useStableCallback.useStableCallback)(element => {
    store.set('listElement', element);
  });

  // Support "closed template" API: if children is a function, implicitly wrap it
  // with a Combobox.Collection that reads items from context/root.
  // Ensures this component's `listProps` subscription does not cause <Combobox.Item>
  // to re-render on every active index change.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return _ComboboxCollection || (_ComboboxCollection = /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxCollection2.ComboboxCollection, {
        children: children
      }));
    }
    return children;
  }, [children]);
  const state = {
    empty
  };
  const floatingId = floatingRootContext.useState('floatingId');
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, setListElement, hasPositionerContext ? null : setPositionerElement],
    props: [listProps, {
      children: resolvedChildren,
      tabIndex: -1,
      id: floatingId,
      role: grid ? 'grid' : 'listbox',
      'aria-multiselectable': multiple ? 'true' : undefined,
      // On a grid the attribute describes cell editability, not selection, so it's left to the
      // combobox element in that mode.
      'aria-readonly': !grid && readOnly ? true : undefined,
      onKeyDown(event) {
        if (store.state.disabled || store.state.readOnly) {
          return;
        }
        if (event.key === 'Enter') {
          const activeIndex = store.state.activeIndex;
          if (activeIndex == null) {
            // Allow form submission when no item is highlighted.
            return;
          }
          (0, _utils.stopEvent)(event);
          (0, _parts.clickHighlightedItem)(store, activeIndex, event.nativeEvent);
        }
      },
      onKeyDownCapture() {
        store.context.keyboardActiveRef.current = true;
      },
      onPointerMoveCapture() {
        store.context.keyboardActiveRef.current = false;
      }
    }, elementProps]
  });
  if (virtualized) {
    return element;
  }

  // With the `items` prop, typeahead labels are derived from the items so they survive the list
  // unmounting (unmounting clears the registered labels). Rendered labels only need to be
  // registered when the list is force-mounted to match browser autofill against rendered text.
  const labelsRef = hasItems && !forceMounted ? undefined : store.context.labelsRef;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeList.CompositeList, {
    elementsRef: store.context.listRef,
    labelsRef: labelsRef,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ComboboxList.displayName = "ComboboxList";