"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _ComboboxClearDataAttributes = require("../../combobox/clear/ComboboxClearDataAttributes");
Object.keys(_ComboboxClearDataAttributes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ComboboxClearDataAttributes[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _ComboboxClearDataAttributes[key];
    }
  });
});