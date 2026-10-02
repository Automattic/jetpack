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

// packages/components/src/scroll-lock/index.tsx
var scroll_lock_exports = {};
__export(scroll_lock_exports, {
  ScrollLock: () => ScrollLock,
  default: () => scroll_lock_default
});
module.exports = __toCommonJS(scroll_lock_exports);
var import_element = require("@wordpress/element");
var previousScrollTop = 0;
function setLocked(locked) {
  const scrollingElement = document.scrollingElement || document.body;
  if (locked) {
    previousScrollTop = scrollingElement.scrollTop;
  }
  const methodName = locked ? "add" : "remove";
  scrollingElement.classList[methodName]("lockscroll");
  document.documentElement.classList[methodName]("lockscroll");
  if (!locked) {
    scrollingElement.scrollTop = previousScrollTop;
  }
}
var lockCounter = 0;
function ScrollLock() {
  (0, import_element.useEffect)(() => {
    if (lockCounter === 0) {
      setLocked(true);
    }
    ++lockCounter;
    return () => {
      if (lockCounter === 1) {
        setLocked(false);
      }
      --lockCounter;
    };
  }, []);
  return null;
}
var scroll_lock_default = ScrollLock;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScrollLock
});
//# sourceMappingURL=index.cjs.map
