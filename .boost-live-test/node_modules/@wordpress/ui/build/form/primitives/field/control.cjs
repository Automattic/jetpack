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

// packages/ui/src/form/primitives/field/control.tsx
var control_exports = {};
__export(control_exports, {
  Control: () => Control
});
module.exports = __toCommonJS(control_exports);
var import_field = require("@base-ui/react/field");
var import_element = require("@wordpress/element");
var import_jsx_runtime = require("react/jsx-runtime");
var Control = (0, import_element.forwardRef)(
  function Control2(props, ref) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_field.Field.Control, { ref, ...props });
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Control
});
//# sourceMappingURL=control.cjs.map
