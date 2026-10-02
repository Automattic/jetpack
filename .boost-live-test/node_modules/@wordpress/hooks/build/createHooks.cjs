"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/hooks/src/createHooks.ts
var createHooks_exports = {};
__export(createHooks_exports, {
  _Hooks: () => _Hooks,
  default: () => createHooks_default
});
module.exports = __toCommonJS(createHooks_exports);
var import_createAddHook = __toESM(require("./createAddHook.cjs"));
var import_createRemoveHook = __toESM(require("./createRemoveHook.cjs"));
var import_createHasHook = __toESM(require("./createHasHook.cjs"));
var import_createRunHook = __toESM(require("./createRunHook.cjs"));
var import_createCurrentHook = __toESM(require("./createCurrentHook.cjs"));
var import_createDoingHook = __toESM(require("./createDoingHook.cjs"));
var import_createDidHook = __toESM(require("./createDidHook.cjs"));
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
    this.addAction = (0, import_createAddHook.default)(this, "actions");
    this.addFilter = (0, import_createAddHook.default)(this, "filters");
    this.removeAction = (0, import_createRemoveHook.default)(this, "actions");
    this.removeFilter = (0, import_createRemoveHook.default)(this, "filters");
    this.hasAction = (0, import_createHasHook.default)(this, "actions");
    this.hasFilter = (0, import_createHasHook.default)(this, "filters");
    this.removeAllActions = (0, import_createRemoveHook.default)(this, "actions", true);
    this.removeAllFilters = (0, import_createRemoveHook.default)(this, "filters", true);
    this.doAction = (0, import_createRunHook.default)(this, "actions", false, false);
    this.doActionAsync = (0, import_createRunHook.default)(this, "actions", false, true);
    this.applyFilters = (0, import_createRunHook.default)(this, "filters", true, false);
    this.applyFiltersAsync = (0, import_createRunHook.default)(this, "filters", true, true);
    this.currentAction = (0, import_createCurrentHook.default)(this, "actions");
    this.currentFilter = (0, import_createCurrentHook.default)(this, "filters");
    this.doingAction = (0, import_createDoingHook.default)(this, "actions");
    this.doingFilter = (0, import_createDoingHook.default)(this, "filters");
    this.didAction = (0, import_createDidHook.default)(this, "actions");
    this.didFilter = (0, import_createDidHook.default)(this, "filters");
  }
};
function createHooks() {
  return new _Hooks();
}
var createHooks_default = createHooks;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  _Hooks
});
//# sourceMappingURL=createHooks.cjs.map
