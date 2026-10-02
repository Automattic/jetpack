"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.error = void 0;
Object.defineProperty(exports, "reset", {
  enumerable: true,
  get: function () {
    return _createLogOnce.reset;
  }
});
var _createLogOnce = require("./createLogOnce");
const error = exports.error = (0, _createLogOnce.createLogOnce)('error', 'Base UI');