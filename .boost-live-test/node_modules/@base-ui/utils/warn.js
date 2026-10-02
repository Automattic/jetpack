"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "reset", {
  enumerable: true,
  get: function () {
    return _createLogOnce.reset;
  }
});
exports.warn = void 0;
var _createLogOnce = require("./createLogOnce");
const warn = exports.warn = (0, _createLogOnce.createLogOnce)('warn', 'Base UI');