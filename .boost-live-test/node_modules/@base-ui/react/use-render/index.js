"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _useRender = require("./useRender");
Object.keys(_useRender).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useRender[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useRender[key];
    }
  });
});