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

// packages/hooks/src/index.ts
var index_exports = {};
__export(index_exports, {
  actions: () => actions,
  addAction: () => addAction,
  addFilter: () => addFilter,
  applyFilters: () => applyFilters,
  applyFiltersAsync: () => applyFiltersAsync,
  createHooks: () => import_createHooks.default,
  currentAction: () => currentAction,
  currentFilter: () => currentFilter,
  defaultHooks: () => defaultHooks,
  didAction: () => didAction,
  didFilter: () => didFilter,
  doAction: () => doAction,
  doActionAsync: () => doActionAsync,
  doingAction: () => doingAction,
  doingFilter: () => doingFilter,
  filters: () => filters,
  hasAction: () => hasAction,
  hasFilter: () => hasFilter,
  removeAction: () => removeAction,
  removeAllActions: () => removeAllActions,
  removeAllFilters: () => removeAllFilters,
  removeFilter: () => removeFilter
});
module.exports = __toCommonJS(index_exports);
var import_createHooks = __toESM(require("./createHooks.cjs"));
var defaultHooks = (0, import_createHooks.default)();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.cjs.map
