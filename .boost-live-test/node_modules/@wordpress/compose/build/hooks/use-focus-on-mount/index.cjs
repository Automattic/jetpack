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

// packages/compose/src/hooks/use-focus-on-mount/index.ts
var use_focus_on_mount_exports = {};
__export(use_focus_on_mount_exports, {
  useFocusOnMount: () => useFocusOnMount
});
module.exports = __toCommonJS(use_focus_on_mount_exports);
var import_dom = require("@wordpress/dom");
var import_element = require("@wordpress/element");
var import_use_ref_effect = __toESM(require("../use-ref-effect/index.cjs"));
function useFocusOnMount(focusOnMount = "firstElement") {
  const focusOnMountRef = (0, import_element.useRef)(focusOnMount);
  const setFocus = (target) => {
    target.focus({
      // When focusing newly mounted dialogs,
      // the position of the popover is often not right on the first render
      // This prevents the layout shifts when focusing the dialogs.
      preventScroll: true
    });
  };
  (0, import_element.useEffect)(() => {
    focusOnMountRef.current = focusOnMount;
  }, [focusOnMount]);
  return (0, import_use_ref_effect.default)((node) => {
    if (focusOnMountRef.current === false) {
      return;
    }
    if (node.contains(node.ownerDocument?.activeElement ?? null)) {
      return;
    }
    if (focusOnMountRef.current !== "firstElement" && focusOnMountRef.current !== "firstInputElement") {
      setFocus(node);
      return;
    }
    const timerId = setTimeout(() => {
      if (focusOnMountRef.current === "firstInputElement") {
        const formInput = node.querySelector(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        if (formInput) {
          setFocus(formInput);
          return;
        }
      }
      const firstTabbable = import_dom.focus.tabbable.find(node)[0];
      if (firstTabbable) {
        setFocus(firstTabbable);
      }
    }, 0);
    return () => {
      clearTimeout(timerId);
    };
  }, []);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useFocusOnMount
});
//# sourceMappingURL=index.cjs.map
