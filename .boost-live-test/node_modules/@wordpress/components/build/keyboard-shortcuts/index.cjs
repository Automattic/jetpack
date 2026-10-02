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

// packages/components/src/keyboard-shortcuts/index.tsx
var keyboard_shortcuts_exports = {};
__export(keyboard_shortcuts_exports, {
  default: () => keyboard_shortcuts_default
});
module.exports = __toCommonJS(keyboard_shortcuts_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_jsx_runtime = require("react/jsx-runtime");
function KeyboardShortcut({
  target,
  callback,
  shortcut,
  bindGlobal,
  eventName
}) {
  (0, import_compose.useKeyboardShortcut)(shortcut, callback, {
    bindGlobal,
    target,
    eventName
  });
  return null;
}
function KeyboardShortcuts({
  children,
  shortcuts,
  bindGlobal,
  eventName
}) {
  const target = (0, import_element.useRef)(null);
  const element = Object.entries(shortcuts ?? {}).map(([shortcut, callback]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyboardShortcut, {
    shortcut,
    callback,
    bindGlobal,
    eventName,
    target
  }, shortcut));
  if (!import_element.Children.count(children)) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {
      children: element
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    ref: target,
    children: [element, children]
  });
}
var keyboard_shortcuts_default = KeyboardShortcuts;
//# sourceMappingURL=index.cjs.map
