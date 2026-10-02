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

// packages/components/src/navigable-container/tabbable.tsx
var tabbable_exports = {};
__export(tabbable_exports, {
  TabbableContainer: () => TabbableContainer,
  UnforwardedTabbableContainer: () => UnforwardedTabbableContainer,
  default: () => tabbable_default
});
module.exports = __toCommonJS(tabbable_exports);
var import_element = require("@wordpress/element");
var import_container = __toESM(require("./container.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedTabbableContainer({
  eventToOffset,
  ...props
}, ref) {
  const innerEventToOffset = (evt) => {
    const {
      code,
      shiftKey
    } = evt;
    if ("Tab" === code) {
      return shiftKey ? -1 : 1;
    }
    if (eventToOffset) {
      return eventToOffset(evt);
    }
    return void 0;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_container.default, {
    ref,
    stopNavigationEvents: true,
    onlyBrowserTabstops: true,
    eventToOffset: innerEventToOffset,
    ...props
  });
}
var TabbableContainer = (0, import_element.forwardRef)(UnforwardedTabbableContainer);
TabbableContainer.displayName = "TabbableContainer";
var tabbable_default = TabbableContainer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TabbableContainer,
  UnforwardedTabbableContainer
});
//# sourceMappingURL=tabbable.cjs.map
