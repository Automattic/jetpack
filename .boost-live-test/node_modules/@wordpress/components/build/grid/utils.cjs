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

// packages/components/src/grid/utils.ts
var utils_exports = {};
__export(utils_exports, {
  getAlignmentProps: () => getAlignmentProps
});
module.exports = __toCommonJS(utils_exports);
var ALIGNMENTS = {
  bottom: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  bottomLeft: {
    alignItems: "flex-start",
    justifyContent: "flex-end"
  },
  bottomRight: {
    alignItems: "flex-end",
    justifyContent: "flex-end"
  },
  center: {
    alignItems: "center",
    justifyContent: "center"
  },
  spaced: {
    alignItems: "center",
    justifyContent: "space-between"
  },
  left: {
    alignItems: "center",
    justifyContent: "flex-start"
  },
  right: {
    alignItems: "center",
    justifyContent: "flex-end"
  },
  stretch: {
    alignItems: "stretch"
  },
  top: {
    alignItems: "flex-start",
    justifyContent: "center"
  },
  topLeft: {
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  topRight: {
    alignItems: "flex-start",
    justifyContent: "flex-end"
  }
};
function getAlignmentProps(alignment) {
  const alignmentProps = alignment ? ALIGNMENTS[alignment] : {};
  return alignmentProps;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAlignmentProps
});
//# sourceMappingURL=utils.cjs.map
