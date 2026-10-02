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

// packages/element/src/platform.ts
var platform_exports = {};
__export(platform_exports, {
  default: () => platform_default
});
module.exports = __toCommonJS(platform_exports);
var Platform = {
  /** Platform identifier. Will always be `'web'` in this module. */
  OS: "web",
  /**
   * Select a value based on the platform.
   *
   * @template T
   * @param    spec - Object with optional platform-specific values.
   * @return The selected value.
   */
  select(spec) {
    return "web" in spec ? spec.web : spec.default;
  },
  /** Whether the platform is web */
  isWeb: true
};
var platform_default = Platform;
//# sourceMappingURL=platform.cjs.map
