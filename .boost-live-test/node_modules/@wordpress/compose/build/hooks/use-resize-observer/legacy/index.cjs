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

// packages/compose/src/hooks/use-resize-observer/legacy/index.tsx
var legacy_exports = {};
__export(legacy_exports, {
  default: () => useLegacyResizeObserver
});
module.exports = __toCommonJS(legacy_exports);
var import_element = require("@wordpress/element");
var import_use_resize_observer = require("../use-resize-observer.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var extractSize = (entry) => {
  let entrySize;
  if (!entry.contentBoxSize) {
    entrySize = [entry.contentRect.width, entry.contentRect.height];
  } else if (entry.contentBoxSize[0]) {
    const contentBoxSize = entry.contentBoxSize[0];
    entrySize = [contentBoxSize.inlineSize, contentBoxSize.blockSize];
  } else {
    const contentBoxSize = entry.contentBoxSize;
    entrySize = [contentBoxSize.inlineSize, contentBoxSize.blockSize];
  }
  const [width, height] = entrySize.map((d) => Math.round(d));
  return { width, height };
};
var RESIZE_ELEMENT_STYLES = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: "none",
  opacity: 0,
  overflow: "hidden",
  zIndex: -1
};
function ResizeElement({ onResize }) {
  const resizeElementRef = (0, import_use_resize_observer.useResizeObserver)((entries) => {
    const newSize = extractSize(entries.at(-1));
    onResize(newSize);
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      ref: resizeElementRef,
      style: RESIZE_ELEMENT_STYLES,
      "aria-hidden": "true"
    }
  );
}
function sizeEquals(a, b) {
  return a.width === b.width && a.height === b.height;
}
var NULL_SIZE = { width: null, height: null };
function useLegacyResizeObserver() {
  const [size, setSize] = (0, import_element.useState)(NULL_SIZE);
  const previousSizeRef = (0, import_element.useRef)(NULL_SIZE);
  const handleResize = (0, import_element.useCallback)((newSize) => {
    if (!sizeEquals(previousSizeRef.current, newSize)) {
      previousSizeRef.current = newSize;
      setSize(newSize);
    }
  }, []);
  const resizeElement = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResizeElement, { onResize: handleResize });
  return [resizeElement, size];
}
//# sourceMappingURL=index.cjs.map
