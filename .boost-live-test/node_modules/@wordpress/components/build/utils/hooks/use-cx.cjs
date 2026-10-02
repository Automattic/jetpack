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

// packages/components/src/utils/hooks/use-cx.ts
var use_cx_exports = {};
__export(use_cx_exports, {
  useCx: () => useCx
});
module.exports = __toCommonJS(use_cx_exports);
var import_react = require("@emotion/react");
var import_utils = require("@emotion/utils");
var import_css = require("@emotion/css");
var import_element = require("@wordpress/element");
var isSerializedStyles = (o) => typeof o !== "undefined" && o !== null && ["name", "styles"].every((p) => typeof o[p] !== "undefined");
var useCx = () => {
  const cache = (0, import_react.__unsafe_useEmotionCache)();
  const cx = (0, import_element.useCallback)((...classNames) => {
    if (cache === null) {
      throw new Error("The `useCx` hook should be only used within a valid Emotion Cache Context");
    }
    return (0, import_css.cx)(...classNames.map((arg) => {
      if (isSerializedStyles(arg)) {
        (0, import_utils.insertStyles)(cache, arg, false);
        return `${cache.key}-${arg.name}`;
      }
      return arg;
    }));
  }, [cache]);
  return cx;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useCx
});
//# sourceMappingURL=use-cx.cjs.map
