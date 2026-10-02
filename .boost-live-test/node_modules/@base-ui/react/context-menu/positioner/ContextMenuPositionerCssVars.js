"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _MenuPositionerCssVars = require("../../menu/positioner/MenuPositionerCssVars");
Object.keys(_MenuPositionerCssVars).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _MenuPositionerCssVars[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _MenuPositionerCssVars[key];
    }
  });
});