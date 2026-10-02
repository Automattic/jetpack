// packages/hooks/src/createHooks.ts
import createAddHook from "./createAddHook.mjs";
import createRemoveHook from "./createRemoveHook.mjs";
import createHasHook from "./createHasHook.mjs";
import createRunHook from "./createRunHook.mjs";
import createCurrentHook from "./createCurrentHook.mjs";
import createDoingHook from "./createDoingHook.mjs";
import createDidHook from "./createDidHook.mjs";
var _Hooks = class {
  actions;
  filters;
  addAction;
  addFilter;
  removeAction;
  removeFilter;
  hasAction;
  hasFilter;
  removeAllActions;
  removeAllFilters;
  doAction;
  doActionAsync;
  applyFilters;
  applyFiltersAsync;
  currentAction;
  currentFilter;
  doingAction;
  doingFilter;
  didAction;
  didFilter;
  constructor() {
    this.actions = /* @__PURE__ */ Object.create(null);
    this.actions.__current = /* @__PURE__ */ new Set();
    this.filters = /* @__PURE__ */ Object.create(null);
    this.filters.__current = /* @__PURE__ */ new Set();
    this.addAction = createAddHook(this, "actions");
    this.addFilter = createAddHook(this, "filters");
    this.removeAction = createRemoveHook(this, "actions");
    this.removeFilter = createRemoveHook(this, "filters");
    this.hasAction = createHasHook(this, "actions");
    this.hasFilter = createHasHook(this, "filters");
    this.removeAllActions = createRemoveHook(this, "actions", true);
    this.removeAllFilters = createRemoveHook(this, "filters", true);
    this.doAction = createRunHook(this, "actions", false, false);
    this.doActionAsync = createRunHook(this, "actions", false, true);
    this.applyFilters = createRunHook(this, "filters", true, false);
    this.applyFiltersAsync = createRunHook(this, "filters", true, true);
    this.currentAction = createCurrentHook(this, "actions");
    this.currentFilter = createCurrentHook(this, "filters");
    this.doingAction = createDoingHook(this, "actions");
    this.doingFilter = createDoingHook(this, "filters");
    this.didAction = createDidHook(this, "actions");
    this.didFilter = createDidHook(this, "filters");
  }
};
function createHooks() {
  return new _Hooks();
}
var createHooks_default = createHooks;
export {
  _Hooks,
  createHooks_default as default
};
//# sourceMappingURL=createHooks.mjs.map
