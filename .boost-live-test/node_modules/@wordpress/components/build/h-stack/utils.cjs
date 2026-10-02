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

// packages/components/src/h-stack/utils.ts
var utils_exports = {};
__export(utils_exports, {
  getAlignmentProps: () => getAlignmentProps
});
module.exports = __toCommonJS(utils_exports);
var import_values = require("../utils/values.cjs");
var H_ALIGNMENTS = {
  bottom: {
    align: "flex-end",
    justify: "center"
  },
  bottomLeft: {
    align: "flex-end",
    justify: "flex-start"
  },
  bottomRight: {
    align: "flex-end",
    justify: "flex-end"
  },
  center: {
    align: "center",
    justify: "center"
  },
  edge: {
    align: "center",
    justify: "space-between"
  },
  left: {
    align: "center",
    justify: "flex-start"
  },
  right: {
    align: "center",
    justify: "flex-end"
  },
  stretch: {
    align: "stretch"
  },
  top: {
    align: "flex-start",
    justify: "center"
  },
  topLeft: {
    align: "flex-start",
    justify: "flex-start"
  },
  topRight: {
    align: "flex-start",
    justify: "flex-end"
  }
};
var V_ALIGNMENTS = {
  bottom: {
    justify: "flex-end",
    align: "center"
  },
  bottomLeft: {
    justify: "flex-end",
    align: "flex-start"
  },
  bottomRight: {
    justify: "flex-end",
    align: "flex-end"
  },
  center: {
    justify: "center",
    align: "center"
  },
  edge: {
    justify: "space-between",
    align: "center"
  },
  left: {
    justify: "center",
    align: "flex-start"
  },
  right: {
    justify: "center",
    align: "flex-end"
  },
  stretch: {
    align: "stretch"
  },
  top: {
    justify: "flex-start",
    align: "center"
  },
  topLeft: {
    justify: "flex-start",
    align: "flex-start"
  },
  topRight: {
    justify: "flex-start",
    align: "flex-end"
  }
};
function getAlignmentProps(alignment, direction = "row") {
  if (!(0, import_values.isValueDefined)(alignment)) {
    return {};
  }
  const isVertical = direction === "column";
  const props = isVertical ? V_ALIGNMENTS : H_ALIGNMENTS;
  const alignmentProps = alignment in props ? props[alignment] : {
    align: alignment
  };
  return alignmentProps;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAlignmentProps
});
//# sourceMappingURL=utils.cjs.map
