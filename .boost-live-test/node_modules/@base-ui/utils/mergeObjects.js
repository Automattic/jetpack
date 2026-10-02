"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeObjects = mergeObjects;
function mergeObjects(a, b) {
  if (a && !b) {
    return a;
  }
  if (!a && b) {
    return b;
  }
  if (a || b) {
    return {
      ...a,
      ...b
    };
  }
  return undefined;
}