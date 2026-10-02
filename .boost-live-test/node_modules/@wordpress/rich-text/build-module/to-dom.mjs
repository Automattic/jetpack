// packages/rich-text/src/to-dom.js
import { toTree } from "./to-tree.mjs";
import { createElement } from "./create-element.mjs";
import { isRangeEqual } from "./is-range-equal.mjs";
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
  const createEmpty = () => createElement(doc, "");
  const tree = toTree({
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
    if (isRangeEqual(range, selection.getRangeAt(0))) {
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
export {
  apply,
  applySelection,
  applyValue,
  toDom
};
//# sourceMappingURL=to-dom.mjs.map
