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

// packages/components/src/tabs/use-track-overflow.ts
var use_track_overflow_exports = {};
__export(use_track_overflow_exports, {
  useTrackOverflow: () => useTrackOverflow
});
module.exports = __toCommonJS(use_track_overflow_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
function useTrackOverflow(parent, children) {
  const [first, setFirst] = (0, import_element.useState)(false);
  const [last, setLast] = (0, import_element.useState)(false);
  const [observer, setObserver] = (0, import_element.useState)();
  const callback = (0, import_compose.useEvent)((entries) => {
    for (const entry of entries) {
      if (entry.target === children.first) {
        setFirst(!entry.isIntersecting);
      }
      if (entry.target === children.last) {
        setLast(!entry.isIntersecting);
      }
    }
  });
  (0, import_element.useEffect)(() => {
    if (!parent || !window.IntersectionObserver) {
      return;
    }
    const newObserver = new IntersectionObserver(callback, {
      root: parent,
      threshold: 0.9
    });
    setObserver(newObserver);
    return () => newObserver.disconnect();
  }, [callback, parent]);
  (0, import_element.useEffect)(() => {
    if (!observer) {
      return;
    }
    if (children.first) {
      observer.observe(children.first);
    }
    if (children.last) {
      observer.observe(children.last);
    }
    return () => {
      if (children.first) {
        observer.unobserve(children.first);
      }
      if (children.last) {
        observer.unobserve(children.last);
      }
    };
  }, [children.first, children.last, observer]);
  return {
    first,
    last
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useTrackOverflow
});
//# sourceMappingURL=use-track-overflow.cjs.map
