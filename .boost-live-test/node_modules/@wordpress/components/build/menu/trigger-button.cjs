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

// packages/components/src/menu/trigger-button.tsx
var trigger_button_exports = {};
__export(trigger_button_exports, {
  TriggerButton: () => TriggerButton
});
module.exports = __toCommonJS(trigger_button_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_context = require("./context.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var TriggerButton = (0, import_element.forwardRef)(function TriggerButton2({
  children,
  disabled = false,
  ...props
}, ref) {
  const menuContext = (0, import_element.useContext)(import_context.Context);
  if (!menuContext?.store) {
    throw new Error("Menu.TriggerButton can only be rendered inside a Menu component");
  }
  if (menuContext.store.parent) {
    throw new Error("Menu.TriggerButton should not be rendered inside a nested Menu component. Use Menu.SubmenuTriggerItem instead.");
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.MenuButton, {
    ref,
    ...props,
    disabled,
    store: menuContext.store,
    children
  });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TriggerButton
});
//# sourceMappingURL=trigger-button.cjs.map
