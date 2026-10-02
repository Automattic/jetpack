"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _MenuPositionerDataAttributes = require("../../menu/positioner/MenuPositionerDataAttributes");
Object.keys(_MenuPositionerDataAttributes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _MenuPositionerDataAttributes[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _MenuPositionerDataAttributes[key];
    }
  });
});