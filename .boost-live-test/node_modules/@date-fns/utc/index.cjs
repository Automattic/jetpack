"use strict";

var _index = require("./date/index.cjs");
Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _index[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index[key];
    }
  });
});
var _mini = require("./date/mini.cjs");
Object.keys(_mini).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _mini[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _mini[key];
    }
  });
});
var _index2 = require("./utc/index.cjs");
Object.keys(_index2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _index2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index2[key];
    }
  });
});