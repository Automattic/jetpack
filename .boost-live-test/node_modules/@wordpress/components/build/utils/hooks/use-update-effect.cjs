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

// packages/components/src/utils/hooks/use-update-effect.js
var use_update_effect_exports = {};
__export(use_update_effect_exports, {
  default: () => use_update_effect_default
});
module.exports = __toCommonJS(use_update_effect_exports);
var import_element = require("@wordpress/element");
function useUpdateEffect(effect, deps) {
  const mountedRef = (0, import_element.useRef)(false);
  (0, import_element.useEffect)(() => {
    if (mountedRef.current) {
      return effect();
    }
    mountedRef.current = true;
    return void 0;
  }, deps);
  (0, import_element.useEffect)(() => () => {
    mountedRef.current = false;
  }, []);
}
var use_update_effect_default = useUpdateEffect;
//# sourceMappingURL=use-update-effect.cjs.map
