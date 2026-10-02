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

// packages/components/src/composite/typeahead.tsx
var typeahead_exports = {};
__export(typeahead_exports, {
  CompositeTypeahead: () => CompositeTypeahead2
});
module.exports = __toCommonJS(typeahead_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_context = require("./context.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var CompositeTypeahead2 = (0, import_element.forwardRef)(function CompositeTypeahead3(props, ref) {
  const context = (0, import_context.useCompositeContext)();
  const store = props.store ?? context.store;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.CompositeTypeahead, {
    store,
    ...props,
    ref
  });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CompositeTypeahead
});
//# sourceMappingURL=typeahead.cjs.map
