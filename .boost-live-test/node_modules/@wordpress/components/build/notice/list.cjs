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

// packages/components/src/notice/list.tsx
var list_exports = {};
__export(list_exports, {
  default: () => list_default
});
module.exports = __toCommonJS(list_exports);
var import_clsx = __toESM(require("clsx"));
var import__ = __toESM(require("./index.cjs"));
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var noop = () => {
};
function NoticeList({
  notices,
  onRemove = noop,
  className,
  children
}) {
  const removeNotice = (id) => () => onRemove(id);
  className = (0, import_clsx.default)("components-notice-list", className);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className,
    children: [children, [...notices].reverse().map((notice) => {
      const {
        content,
        ...restNotice
      } = notice;
      return /* @__PURE__ */ (0, import_react.createElement)(import__.default, {
        ...restNotice,
        key: notice.id,
        onRemove: removeNotice(notice.id)
      }, notice.content);
    })]
  });
}
var list_default = NoticeList;
//# sourceMappingURL=list.cjs.map
