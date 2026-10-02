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

// packages/components/src/navigator/legacy.ts
var legacy_exports = {};
__export(legacy_exports, {
  NavigatorBackButton: () => NavigatorBackButton,
  NavigatorButton: () => NavigatorButton,
  NavigatorProvider: () => NavigatorProvider,
  NavigatorScreen: () => NavigatorScreen,
  NavigatorToParentButton: () => NavigatorToParentButton,
  useNavigator: () => import_use_navigator.useNavigator
});
module.exports = __toCommonJS(legacy_exports);
var import_component = require("./navigator/component.cjs");
var import_component2 = require("./navigator-screen/component.cjs");
var import_component3 = require("./navigator-button/component.cjs");
var import_component4 = require("./navigator-back-button/component.cjs");
var import_component5 = require("./navigator-to-parent-button/component.cjs");
var import_use_navigator = require("./use-navigator.cjs");
var NavigatorProvider = Object.assign(import_component.Navigator, {
  displayName: "NavigatorProvider"
});
var NavigatorScreen = Object.assign(import_component2.NavigatorScreen, {
  displayName: "NavigatorScreen"
});
var NavigatorButton = Object.assign(import_component3.NavigatorButton, {
  displayName: "NavigatorButton"
});
var NavigatorBackButton = Object.assign(import_component4.NavigatorBackButton, {
  displayName: "NavigatorBackButton"
});
var NavigatorToParentButton = Object.assign(import_component5.NavigatorToParentButton, {
  displayName: "NavigatorToParentButton"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NavigatorBackButton,
  NavigatorButton,
  NavigatorProvider,
  NavigatorScreen,
  NavigatorToParentButton,
  useNavigator
});
//# sourceMappingURL=legacy.cjs.map
