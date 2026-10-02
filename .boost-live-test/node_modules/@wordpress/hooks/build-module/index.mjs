// packages/hooks/src/index.ts
import createHooks from "./createHooks.mjs";
var defaultHooks = createHooks();
var {
  addAction,
  addFilter,
  removeAction,
  removeFilter,
  hasAction,
  hasFilter,
  removeAllActions,
  removeAllFilters,
  doAction,
  doActionAsync,
  applyFilters,
  applyFiltersAsync,
  currentAction,
  currentFilter,
  doingAction,
  doingFilter,
  didAction,
  didFilter,
  actions,
  filters
} = defaultHooks;
export {
  actions,
  addAction,
  addFilter,
  applyFilters,
  applyFiltersAsync,
  createHooks,
  currentAction,
  currentFilter,
  defaultHooks,
  didAction,
  didFilter,
  doAction,
  doActionAsync,
  doingAction,
  doingFilter,
  filters,
  hasAction,
  hasFilter,
  removeAction,
  removeAllActions,
  removeAllFilters,
  removeFilter
};
//# sourceMappingURL=index.mjs.map
