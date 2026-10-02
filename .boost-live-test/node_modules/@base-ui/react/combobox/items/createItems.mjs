import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { error } from '@base-ui/utils/error';
import { flattenLeafItems, stringifyAsLabel } from "../../internals/resolveValueLabel.mjs";
import { findCollectionItem } from "./itemCollection.mjs";

/** Whether any constituent of `Item` explicitly declares an `items` field that may be an array. */

// The group-shape guard stays outside this union because folding it in breaks tsc's leaf-item
// inference for grouped data.

/**
 * Creates a collection for the root's `items` prop. Values and labels are derived on first use.
 *
 * Accepts either a flat item array or an array of groups. The `getValue` and `getLabel` accessors
 * receive items, not groups.
 *
 * Items cannot have an `items` array property because they would be interpreted as groups.
 * Rename that field or cast the data when the runtime values are known not to contain arrays.
 *
 * The data must not contain nullish entries: remove them before creating the collection, as for
 * the root's `items` prop.
 *
 * Create static collections at module scope. Wrap dynamic collections in `React.useMemo()` keyed
 * by their data.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param data The flat or grouped source items, or `undefined` while they are loading.
 * @param options Functions that derive each source item's selection value and display label.
 * @returns A collection whose selection value is the `getValue` accessor's return value.
 */
export function createComboboxItems(/** @type ComboboxItemsData<Item> | undefined */
data, options) {
  const {
    getValue,
    getLabel
  } = options;
  let valueToItem = null;

  // Lazily indexes the collection's own `data`, so the accessors never run at creation.
  function ensureDerived() {
    if (valueToItem === null) {
      const derived = new Map();
      const leafItems = data ? flattenLeafItems(data) : EMPTY_ARRAY;
      for (const item of leafItems) {
        // Skipped defensively: the data is documented as free of nullish entries.
        if (item == null) {
          continue;
        }
        const derivedValue = getValue(item);
        // First occurrence wins, so a duplicated derived value resolves to one stable label.
        if (!derived.has(derivedValue)) {
          derived.set(derivedValue, item);
        } else if (process.env.NODE_ENV !== 'production') {
          error(`Two items passed to createItems() derived the value ${String(derivedValue)}, so selection and label ` + 'resolution cannot tell them apart: the first item wins the label and every item ' + 'carrying the value renders as selected. Return a unique value from `getValue`.');
        }
      }
      valueToItem = derived;
    }
    return valueToItem;
  }

  // A pure projection with stable identity: the root feeds it to memos and effects, and the
  // collection never stores items it does not own.
  function value(item) {
    if (item == null) {
      return item;
    }
    return getValue(item);
  }
  return {
    // Passed through rather than defaulted: data that has not loaded must stay the absence of
    // items rather than an empty list that filters everything away.
    data,
    value,
    hasValue(itemValue, isEqual) {
      return findCollectionItem(ensureDerived(), itemValue, isEqual) !== undefined;
    },
    itemLabel: getLabel,
    label(itemValue, isEqual, fallback) {
      const item = findCollectionItem(ensureDerived(), itemValue, isEqual);
      if (item !== undefined) {
        return getLabel(item);
      }
      return stringifyAsLabel(itemValue, fallback);
    }
  };
}