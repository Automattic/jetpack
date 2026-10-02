// packages/rich-text/src/to-html-string.js
import {
  escapeEditableHTML,
  escapeAttribute,
  isValidAttributeName
} from "@wordpress/escape-html";
import { toTree } from "./to-tree.mjs";
function toHTMLString({ value, preserveWhiteSpace }) {
  const tree = toTree({
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
    if (!isValidAttributeName(key)) {
      continue;
    }
    attributeString += ` ${key}="${escapeAttribute(
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
    return child.text === void 0 ? createElementHTML(child) : escapeEditableHTML(child.text);
  }).join("");
}
export {
  toHTMLString
};
//# sourceMappingURL=to-html-string.mjs.map
