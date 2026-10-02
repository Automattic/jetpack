import { compareItemEquality } from "../internals/itemEquality.mjs";
import { hasNullItemLabel } from "../internals/resolveValueLabel.mjs";

/**
 * Non-reactive values shared with the combobox parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */

export const selectors = {
  id: state => state.id,
  labelId: state => state.labelId,
  items: state => state.items,
  selectedValue: state => state.selectedValue,
  hasSelectionChips: state => {
    const selectedValue = state.selectedValue;
    return Array.isArray(selectedValue) && selectedValue.length > 0;
  },
  hasSelectedValue: state => {
    const {
      selectedValue,
      selectionMode
    } = state;
    if (selectedValue == null) {
      return false;
    }
    if (selectionMode === 'multiple' && Array.isArray(selectedValue)) {
      return selectedValue.length > 0;
    }
    return true;
  },
  hasNullItemLabel: (state, enabled) => {
    return enabled ? hasNullItemLabel(state.items) : false;
  },
  open: state => state.open,
  mounted: state => state.mounted,
  forceMounted: state => state.forceMounted,
  inline: state => state.inline,
  activeIndex: state => state.activeIndex,
  selectedIndex: state => state.selectedIndex,
  isActive: (state, index) => state.activeIndex === index,
  isSelected: (state, itemValue) => {
    const comparer = state.isItemEqualToValue;
    const selectedValue = state.selectedValue;
    if (Array.isArray(selectedValue)) {
      return selectedValue.some(selectedItem => compareItemEquality(itemValue, selectedItem, comparer));
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  },
  transitionStatus: state => state.transitionStatus,
  popupProps: state => state.popupProps,
  listProps: state => state.listProps,
  inputProps: state => state.inputProps,
  triggerProps: state => state.triggerProps,
  itemProps: state => state.itemProps,
  positionerElement: state => state.positionerElement,
  listElement: state => state.listElement,
  popupId: state => state.popupId,
  triggerElement: state => state.triggerElement,
  inputElement: state => state.inputElement,
  inputGroupElement: state => state.inputGroupElement,
  popupSide: state => state.popupSide,
  openMethod: state => state.openMethod,
  inputInsidePopup: state => state.inputInsidePopup,
  inputOwnsFormValue: state => state.inputOwnsFormValue,
  selectionMode: state => state.selectionMode,
  name: state => state.name,
  form: state => state.form,
  disabled: state => state.disabled,
  readOnly: state => state.readOnly,
  required: state => state.required,
  grid: state => state.grid,
  virtualized: state => state.virtualized,
  itemToStringLabel: state => state.itemToStringLabel,
  isItemEqualToValue: state => state.isItemEqualToValue,
  modal: state => state.modal,
  autoHighlight: state => state.autoHighlight
};