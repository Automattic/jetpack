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

// packages/rich-text/src/to-dom.js
var to_dom_exports = {};
__export(to_dom_exports, {
  apply: () => apply,
  applySelection: () => applySelection,
  applyValue: () => applyValue,
  toDom: () => toDom
});
module.exports = __toCommonJS(to_dom_exports);
var import_to_tree = require("./to-tree.cjs");
var import_create_element = require("./create-element.cjs");
var import_is_range_equal = require("./is-range-equal.cjs");
var MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
function createPathToNode(node, rootNode, path) {
  const parentNode = node.parentNode;
  let i = 0;
  while (node = node.previousSibling) {
    i++;
  }
  path = [i, ...path];
  if (parentNode !== rootNode) {
    path = createPathToNode(parentNode, rootNode, path);
  }
  return path;
}
function getNodeByPath(node, path) {
  path = [...path];
  while (node && path.length > 1) {
    node = node.childNodes[path.shift()];
  }
  return {
    node,
    offset: path[0]
  };
}
function append(element, child) {
  if (child.html !== void 0) {
    return element.innerHTML += child.html;
  }
  if (typeof child === "string") {
    child = element.ownerDocument.createTextNode(child);
  }
  const { type, attributes } = child;
  if (type) {
    if (type === "#comment") {
      child = element.ownerDocument.createComment(
        attributes["data-rich-text-comment"]
      );
    } else {
      const parentNamespace = element.namespaceURI;
      if (type === "math") {
        child = element.ownerDocument.createElementNS(
          MATHML_NAMESPACE,
          type
        );
      } else if (parentNamespace === MATHML_NAMESPACE) {
        if (element.tagName === "MTEXT") {
          child = element.ownerDocument.createElement(type);
        } else {
          child = element.ownerDocument.createElementNS(
            MATHML_NAMESPACE,
            type
          );
        }
      } else {
        child = element.ownerDocument.createElement(type);
      }
      for (const key in attributes) {
        child.setAttribute(key, attributes[key]);
      }
    }
  }
  return element.appendChild(child);
}
function appendText(node, text) {
  node.appendData(text);
}
function getLastChild({ lastChild }) {
  return lastChild;
}
function getParent({ parentNode }) {
  return parentNode;
}
function isText(node) {
  return node.nodeType === node.TEXT_NODE;
}
function getText({ nodeValue }) {
  return nodeValue;
}
function remove(node) {
  return node.parentNode.removeChild(node);
}
function toDom({
  value,
  prepareEditableTree,
  isEditableTree = true,
  placeholder,
  doc = document
}) {
  let startPath = [];
  let endPath = [];
  if (prepareEditableTree) {
    value = {
      ...value,
      formats: prepareEditableTree(value)
    };
  }
  const createEmpty = () => (0, import_create_element.createElement)(doc, "");
  const tree = (0, import_to_tree.toTree)({
    value,
    createEmpty,
    append,
    getLastChild,
    getParent,
    isText,
    getText,
    remove,
    appendText,
    onStartIndex(body, pointer) {
      startPath = createPathToNode(pointer, body, [
        pointer.nodeValue.length
      ]);
    },
    onEndIndex(body, pointer) {
      endPath = createPathToNode(pointer, body, [
        pointer.nodeValue.length
      ]);
    },
    isEditableTree,
    placeholder
  });
  return {
    body: tree,
    selection: { startPath, endPath }
  };
}
function apply({
  value,
  current,
  prepareEditableTree,
  __unstableDomOnly,
  placeholder
}) {
  const { body, selection } = toDom({
    value,
    prepareEditableTree,
    placeholder,
    doc: current.ownerDocument
  });
  applyValue(body, current);
  if (value.start !== void 0 && !__unstableDomOnly) {
    applySelection(selection, current);
  }
}
function applyValue(future, current) {
  let i = 0;
  let futureChild;
  while (futureChild = future.firstChild) {
    const currentChild = current.childNodes[i];
    if (!currentChild) {
      current.appendChild(futureChild);
    } else if (!currentChild.isEqualNode(futureChild)) {
      if (currentChild.nodeName !== futureChild.nodeName || currentChild.nodeType === currentChild.TEXT_NODE && currentChild.data !== futureChild.data) {
        current.replaceChild(futureChild, currentChild);
      } else {
        const currentAttributes = currentChild.attributes;
        const futureAttributes = futureChild.attributes;
        if (currentAttributes) {
          let ii = currentAttributes.length;
          while (ii--) {
            const { name } = currentAttributes[ii];
            if (!futureChild.getAttribute(name)) {
              currentChild.removeAttribute(name);
            }
          }
        }
        if (futureAttributes) {
          for (let ii = 0; ii < futureAttributes.length; ii++) {
            const { name, value } = futureAttributes[ii];
            if (currentChild.getAttribute(name) !== value) {
              currentChild.setAttribute(name, value);
            }
          }
        }
        applyValue(futureChild, currentChild);
        future.removeChild(futureChild);
      }
    } else {
      future.removeChild(futureChild);
    }
    i++;
  }
  while (current.childNodes[i]) {
    current.removeChild(current.childNodes[i]);
  }
}
function applySelection({ startPath, endPath }, current) {
  const { node: startContainer, offset: startOffset } = getNodeByPath(
    current,
    startPath
  );
  const { node: endContainer, offset: endOffset } = getNodeByPath(
    current,
    endPath
  );
  const { ownerDocument } = current;
  const { defaultView } = ownerDocument;
  const selection = defaultView.getSelection();
  const range = ownerDocument.createRange();
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  const { activeElement } = ownerDocument;
  if (selection.rangeCount > 0) {
    if ((0, import_is_range_equal.isRangeEqual)(range, selection.getRangeAt(0))) {
      return;
    }
    selection.removeAllRanges();
  }
  selection.addRange(range);
  if (activeElement !== ownerDocument.activeElement) {
    if (activeElement instanceof defaultView.HTMLElement) {
      activeElement.focus();
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apply,
  applySelection,
  applyValue,
  toDom
});
//# sourceMappingURL=to-dom.cjs.map
