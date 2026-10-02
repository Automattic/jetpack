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

// packages/components/src/focusable-iframe/index.tsx
var focusable_iframe_exports = {};
__export(focusable_iframe_exports, {
  default: () => FocusableIframe
});
module.exports = __toCommonJS(focusable_iframe_exports);
var import_compose = require("@wordpress/compose");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_jsx_runtime = require("react/jsx-runtime");
function FocusableIframe({
  iframeRef,
  ...props
}) {
  const ref = (0, import_compose.useMergeRefs)([iframeRef, (0, import_compose.useFocusableIframe)()]);
  (0, import_deprecated.default)("wp.components.FocusableIframe", {
    since: "5.9",
    alternative: "wp.compose.useFocusableIframe"
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
    ref,
    ...props
  });
}
//# sourceMappingURL=index.cjs.map
