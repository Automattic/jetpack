"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ownerDocument = ownerDocument;
Object.defineProperty(exports, "ownerWindow", {
  enumerable: true,
  get: function () {
    return _dom.getWindow;
  }
});
var _dom = require("@floating-ui/utils/dom");
function ownerDocument(node) {
  return node?.ownerDocument || document;
}