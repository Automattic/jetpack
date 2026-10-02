'use client';

import * as React from 'react';
import { createCollatorItemFilter, createSingleSelectionCollatorFilter } from "./index.mjs";
import { getFilter } from "../../../internals/filter.mjs";
/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export const useCoreFilter = getFilter;
/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export function useComboboxFilter(options = {}) {
  const {
    multiple = false,
    value,
    ...collatorOptions
  } = options;
  const coreFilter = getFilter(collatorOptions);
  const contains = React.useCallback((item, query, itemToString) => {
    if (multiple) {
      return createCollatorItemFilter(coreFilter, itemToString)(item, query);
    }
    return createSingleSelectionCollatorFilter(coreFilter, itemToString, value)(item, query);
  }, [coreFilter, value, multiple]);
  return React.useMemo(() => ({
    ...coreFilter,
    contains
  }), [contains, coreFilter]);
}