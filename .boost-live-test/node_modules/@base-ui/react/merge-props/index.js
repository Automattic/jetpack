"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _mergeProps = require("./mergeProps");
Object.keys(_mergeProps).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _mergeProps[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _mergeProps[key];
    }
  });
});