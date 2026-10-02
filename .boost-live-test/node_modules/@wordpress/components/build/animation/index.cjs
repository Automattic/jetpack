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

// packages/components/src/animation/index.tsx
var animation_exports = {};
__export(animation_exports, {
  __unstableAnimatePresence: () => import_framer_motion.AnimatePresence,
  __unstableMotion: () => import_framer_motion.motion
});
module.exports = __toCommonJS(animation_exports);
var import_framer_motion = require("framer-motion");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  __unstableAnimatePresence,
  __unstableMotion
});
//# sourceMappingURL=index.cjs.map
