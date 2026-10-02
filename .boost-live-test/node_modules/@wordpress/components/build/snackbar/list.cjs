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

// packages/components/src/snackbar/list.tsx
var list_exports = {};
__export(list_exports, {
  SnackbarList: () => SnackbarList,
  default: () => list_default
});
module.exports = __toCommonJS(list_exports);
var import_clsx = __toESM(require("clsx"));
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import__ = __toESM(require("./index.cjs"));
var import_animation = require("../animation/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var SNACKBAR_VARIANTS = {
  init: {
    height: 0,
    opacity: 0
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        type: "tween",
        duration: 0.3,
        ease: [0, 0, 0.2, 1]
      },
      opacity: {
        type: "tween",
        duration: 0.25,
        delay: 0.05,
        ease: [0, 0, 0.2, 1]
      }
    }
  },
  exit: {
    opacity: 0,
    transition: {
      type: "tween",
      duration: 0.1,
      ease: [0, 0, 0.2, 1]
    }
  }
};
function SnackbarList({
  notices,
  className,
  children,
  onRemove
}) {
  const listRef = (0, import_element.useRef)(null);
  const isReducedMotion = (0, import_compose.useReducedMotion)();
  className = (0, import_clsx.default)("components-snackbar-list", className);
  const removeNotice = (notice) => () => onRemove?.(notice.id);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className,
    tabIndex: -1,
    ref: listRef,
    "data-testid": "snackbar-list",
    children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_animation.__unstableAnimatePresence, {
      children: notices.map((notice) => {
        const {
          content,
          ...restNotice
        } = notice;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_animation.__unstableMotion.div, {
          layout: isReducedMotion ? false : "position",
          style: {
            width: "100%"
          },
          initial: "init",
          animate: "open",
          exit: "exit",
          variants: isReducedMotion ? void 0 : SNACKBAR_VARIANTS,
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
            className: "components-snackbar-list__notice-container",
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import__.default, {
              ...restNotice,
              onRemove: removeNotice(notice),
              listRef,
              children: notice.content
            })
          })
        }, notice.id);
      })
    })]
  });
}
var list_default = SnackbarList;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SnackbarList
});
//# sourceMappingURL=list.cjs.map
