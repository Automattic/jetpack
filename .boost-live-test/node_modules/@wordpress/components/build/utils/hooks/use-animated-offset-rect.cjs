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

// packages/components/src/utils/hooks/use-animated-offset-rect.ts
var use_animated_offset_rect_exports = {};
__export(use_animated_offset_rect_exports, {
  useAnimatedOffsetRect: () => useAnimatedOffsetRect
});
module.exports = __toCommonJS(use_animated_offset_rect_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_use_on_value_update = require("./use-on-value-update.cjs");
function useAnimatedOffsetRect(container, rect, {
  prefix = "subelement",
  dataAttribute = `${prefix}-animated`,
  transitionEndFilter = () => true,
  roundRect = false
} = {}) {
  const setProperties = (0, import_compose.useEvent)(() => {
    Object.keys(rect).forEach((property) => property !== "element" && container?.style.setProperty(`--${prefix}-${property}`, String(roundRect ? Math.floor(rect[property]) : rect[property])));
  });
  (0, import_element.useLayoutEffect)(() => {
    setProperties();
  }, [rect, setProperties]);
  (0, import_use_on_value_update.useOnValueUpdate)(rect.element, ({
    previousValue
  }) => {
    if (rect.element && previousValue) {
      container?.setAttribute(`data-${dataAttribute}`, "");
    }
  });
  (0, import_element.useLayoutEffect)(() => {
    function onTransitionEnd(event) {
      if (transitionEndFilter(event)) {
        container?.removeAttribute(`data-${dataAttribute}`);
      }
    }
    container?.addEventListener("transitionend", onTransitionEnd);
    return () => container?.removeEventListener("transitionend", onTransitionEnd);
  }, [dataAttribute, container, transitionEndFilter]);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useAnimatedOffsetRect
});
//# sourceMappingURL=use-animated-offset-rect.cjs.map
