import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
// Compared by identity in `findSelectionIndex`; don't wrap it.
export const defaultItemEquality = (itemValue, selectedValue) => Object.is(itemValue, selectedValue);
export function compareItemEquality(itemValue, selectedValue, comparer) {
  if (itemValue == null || selectedValue == null) {
    return Object.is(itemValue, selectedValue);
  }
  return comparer(itemValue, selectedValue);
}
export function isSelectedValueDirty(currentValue, initialValue, comparer) {
  if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
    return !areArraysEqual(currentValue, initialValue, (itemValue, initialItemValue) => compareItemEquality(itemValue, initialItemValue, comparer));
  }
  return currentValue !== initialValue;
}
export function selectedValueIncludes(selectedValues, itemValue, comparer) {
  if (!selectedValues) {
    return false;
  }
  return selectedValues.some(selectedValue => {
    if (selectedValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}
export function findItemIndex(itemValues, selectedValue, comparer) {
  if (!itemValues) {
    return -1;
  }
  return itemValues.findIndex(itemValue => {
    if (itemValue === undefined) {
      return false;
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  });
}

// The default comparer is `Object.is`, so the values can be indexed instead of rescanned
// for every item. A custom comparer may match values that don't hash alike.
function createSelectionMatcher(selectedValues, comparer) {
  if (comparer !== defaultItemEquality) {
    return itemValue => selectedValueIncludes(selectedValues, itemValue, comparer);
  }
  const index = new Set(selectedValues);
  index.delete(undefined);
  // `Set` treats +0 and -0 as equal; `Object.is` does not.
  return itemValue => index.has(itemValue) && (itemValue !== 0 || selectedValues.some(v => Object.is(itemValue, v)));
}
export function findSelectionIndex(itemValues, selectedValue, comparer, multiple) {
  // Only treat the value as a list in multiple mode: an array can itself be a valid
  // single-select value.
  const index = multiple && Array.isArray(selectedValue) ?
  // Anchor to the first selected item in rendered order so the index does not depend
  // on the order in which the values were added to the array.
  itemValues.findIndex(createSelectionMatcher(selectedValue, comparer)) : findItemIndex(itemValues, selectedValue, comparer);
  return index === -1 ? null : index;
}

/** Resolves the first selected index as items register or change. */
export function resolveSelectedIndex(index, itemValue, registry, selectedValues, comparer, currentIndex) {
  if (selectedValueIncludes(selectedValues, itemValue, comparer)) {
    // A later item only takes over once the current anchor stops being selected.
    return currentIndex != null && index > currentIndex && selectedValueIncludes(selectedValues, registry[currentIndex], comparer) ? currentIndex : index;
  }
  // The holder re-elects the anchor once it stops being selected.
  return index === currentIndex ? findSelectionIndex(registry, selectedValues, comparer, true) : currentIndex;
}
export function removeItem(selectedValues, itemValue, comparer) {
  return selectedValues.filter(selectedValue => !compareItemEquality(itemValue, selectedValue, comparer));
}