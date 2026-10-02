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

// packages/rich-text/src/hook/use-anchor-ref.js
var use_anchor_ref_exports = {};
__export(use_anchor_ref_exports, {
  useAnchorRef: () => useAnchorRef
});
module.exports = __toCommonJS(use_anchor_ref_exports);
var import_element = require("@wordpress/element");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_get_active_format = require("../get-active-format.cjs");
function useAnchorRef({ ref, value, settings = {} }) {
  (0, import_deprecated.default)("`useAnchorRef` hook", {
    since: "6.1",
    alternative: "`useAnchor` hook"
  });
  const { tagName, className, name } = settings;
  const activeFormat = name ? (0, import_get_active_format.getActiveFormat)(value, name) : void 0;
  return (0, import_element.useMemo)(() => {
    if (!ref.current) {
      return;
    }
    const {
      ownerDocument: { defaultView }
    } = ref.current;
    const selection = defaultView.getSelection();
    if (!selection.rangeCount) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!activeFormat) {
      return range;
    }
    let element = range.startContainer;
    element = element.nextElementSibling || element;
    while (element.nodeType !== element.ELEMENT_NODE) {
      element = element.parentNode;
    }
    return element.closest(
      tagName + (className ? "." + className : "")
    );
  }, [activeFormat, value.start, value.end, tagName, className]);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useAnchorRef
});
//# sourceMappingURL=use-anchor-ref.cjs.map
