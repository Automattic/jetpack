"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectors = void 0;
var _itemEquality = require("../internals/itemEquality");
var _resolveValueLabel = require("../internals/resolveValueLabel");
/**
 * Non-reactive values shared with the select parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */

const selectors = exports.selectors = {
  id: state => state.id,
  labelId: state => state.labelId,
  modal: state => state.modal,
  items: state => state.items,
  itemToStringLabel: state => state.itemToStringLabel,
  isItemEqualToValue: state => state.isItemEqualToValue,
  value: state => state.value,
  hasSelectedValue: state => {
    const {
      value,
      multiple,
      itemToStringValue
    } = state;
    if (value == null) {
      return false;
    }
    if (multiple && Array.isArray(value)) {
      return value.length > 0;
    }
    return (0, _resolveValueLabel.stringifyAsValue)(value, itemToStringValue) !== '';
  },
  hasNullItemLabel: (state, enabled) => {
    return enabled ? (0, _resolveValueLabel.hasNullItemLabel)(state.items) : false;
  },
  open: state => state.open,
  mounted: state => state.mounted,
  forceMount: state => state.forceMount,
  transitionStatus: state => state.transitionStatus,
  openMethod: state => state.openMethod,
  activeIndex: state => state.activeIndex,
  selectedIndex: state => state.selectedIndex,
  isActive: (state, index) => state.activeIndex === index,
  isSelected: (state, itemValue) => {
    const comparer = state.isItemEqualToValue;
    const storeValue = state.value;
    if (state.multiple) {
      return Array.isArray(storeValue) && storeValue.some(selectedItem => (0, _itemEquality.compareItemEquality)(itemValue, selectedItem, comparer));
    }

    // The value is the source of truth: a stale `selectedIndex` (e.g. the controlled
    // value changes while the popup is open, where the index sync is deferred) must not
    // keep a previously selected item marked as selected.
    return (0, _itemEquality.compareItemEquality)(itemValue, storeValue, comparer);
  },
  isSelectedByFocus: (state, index) => {
    return state.selectedIndex === index;
  },
  popupProps: state => state.popupProps,
  triggerProps: state => state.triggerProps,
  triggerElement: state => state.triggerElement,
  positionerElement: state => state.positionerElement,
  listElement: state => state.listElement,
  popupSide: state => state.popupSide,
  scrollUpArrowVisible: state => state.scrollUpArrowVisible,
  scrollDownArrowVisible: state => state.scrollDownArrowVisible,
  hasScrollArrows: state => state.hasScrollArrows
};