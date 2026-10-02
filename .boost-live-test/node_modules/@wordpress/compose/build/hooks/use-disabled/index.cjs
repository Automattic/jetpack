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

// packages/compose/src/hooks/use-disabled/index.ts
var use_disabled_exports = {};
__export(use_disabled_exports, {
  default: () => useDisabled
});
module.exports = __toCommonJS(use_disabled_exports);
var import_debounce = require("../../utils/debounce/index.cjs");
var import_use_ref_effect = __toESM(require("../use-ref-effect/index.cjs"));
function useDisabled({
  isDisabled: isDisabledProp = false
} = {}) {
  return (0, import_use_ref_effect.default)(
    (node) => {
      if (isDisabledProp) {
        return;
      }
      const defaultView = node?.ownerDocument?.defaultView;
      if (!defaultView) {
        return;
      }
      const updates = [];
      const disable = () => {
        node.childNodes.forEach((child) => {
          if (!(child instanceof defaultView.HTMLElement)) {
            return;
          }
          if (!child.getAttribute("inert")) {
            child.setAttribute("inert", "true");
            updates.push(() => {
              child.removeAttribute("inert");
            });
          }
        });
      };
      const debouncedDisable = (0, import_debounce.debounce)(disable, 0, {
        leading: true
      });
      disable();
      const observer = new window.MutationObserver(debouncedDisable);
      observer.observe(node, {
        childList: true
      });
      return () => {
        if (observer) {
          observer.disconnect();
        }
        debouncedDisable.cancel();
        updates.forEach((update) => update());
      };
    },
    [isDisabledProp]
  );
}
//# sourceMappingURL=index.cjs.map
