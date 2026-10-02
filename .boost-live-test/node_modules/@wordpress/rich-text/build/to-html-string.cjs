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

// packages/rich-text/src/to-html-string.js
var to_html_string_exports = {};
__export(to_html_string_exports, {
  toHTMLString: () => toHTMLString
});
module.exports = __toCommonJS(to_html_string_exports);
var import_escape_html = require("@wordpress/escape-html");
var import_to_tree = require("./to-tree.cjs");
function toHTMLString({ value, preserveWhiteSpace }) {
  const tree = (0, import_to_tree.toTree)({
    value,
    preserveWhiteSpace,
    createEmpty,
    append,
    getLastChild,
    getParent,
    isText,
    getText,
    remove,
    appendText
  });
  return createChildrenHTML(tree.children);
}
function createEmpty() {
  return {};
}
function getLastChild({ children }) {
  return children && children[children.length - 1];
}
function append(parent, object) {
  if (typeof object === "string") {
    object = { text: object };
  }
  object.parent = parent;
  parent.children = parent.children || [];
  parent.children.push(object);
  return object;
}
function appendText(object, text) {
  object.text += text;
}
function getParent({ parent }) {
  return parent;
}
function isText({ text }) {
  return typeof text === "string";
}
function getText({ text }) {
  return text;
}
function remove(object) {
  const index = object.parent.children.indexOf(object);
  if (index !== -1) {
    object.parent.children.splice(index, 1);
  }
  return object;
}
function createElementHTML({ type, attributes, object, children }) {
  if (type === "#comment") {
    return `<!--${attributes["data-rich-text-comment"]}-->`;
  }
  let attributeString = "";
  for (const key in attributes) {
    if (!(0, import_escape_html.isValidAttributeName)(key)) {
      continue;
    }
    attributeString += ` ${key}="${(0, import_escape_html.escapeAttribute)(
      attributes[key]
    )}"`;
  }
  if (object) {
    return `<${type}${attributeString}>`;
  }
  return `<${type}${attributeString}>${createChildrenHTML(
    children
  )}</${type}>`;
}
function createChildrenHTML(children = []) {
  return children.map((child) => {
    if (child.html !== void 0) {
      return child.html;
    }
    return child.text === void 0 ? createElementHTML(child) : (0, import_escape_html.escapeEditableHTML)(child.text);
  }).join("");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  toHTMLString
});
//# sourceMappingURL=to-html-string.cjs.map
