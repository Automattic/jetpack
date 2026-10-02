"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useComboboxFilter = useComboboxFilter;
exports.useCoreFilter = void 0;
var React = _interopRequireWildcard(require("react"));
var _index = require("./index");
var _filter = require("../../../internals/filter");
/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
const useCoreFilter = exports.useCoreFilter = _filter.getFilter;
/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
function useComboboxFilter(options = {}) {
  const {
    multiple = false,
    value,
    ...collatorOptions
  } = options;
  const coreFilter = (0, _filter.getFilter)(collatorOptions);
  const contains = React.useCallback((item, query, itemToString) => {
    if (multiple) {
      return (0, _index.createCollatorItemFilter)(coreFilter, itemToString)(item, query);
    }
    return (0, _index.createSingleSelectionCollatorFilter)(coreFilter, itemToString, value)(item, query);
  }, [coreFilter, value, multiple]);
  return React.useMemo(() => ({
    ...coreFilter,
    contains
  }), [contains, coreFilter]);
}