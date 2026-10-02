"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/navigator/use-navigator.ts
var use_navigator_exports = {};
__export(use_navigator_exports, {
  useNavigator: () => useNavigator
});
module.exports = __toCommonJS(use_navigator_exports);
var import_element = require("@wordpress/element");
var import_context = require("./context.cjs");
function useNavigator() {
  const {
    location,
    params,
    goTo,
    goBack,
    goToParent
  } = (0, import_element.useContext)(import_context.NavigatorContext);
  return {
    location,
    goTo,
    goBack,
    goToParent,
    params
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useNavigator
});
//# sourceMappingURL=use-navigator.cjs.map
