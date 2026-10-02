"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  useAriaLabelledBy: true,
  useLabelableContext: true,
  useLabelableId: true,
  useLabel: true
};
Object.defineProperty(exports, "useAriaLabelledBy", {
  enumerable: true,
  get: function () {
    return _useAriaLabelledBy.useAriaLabelledBy;
  }
});
Object.defineProperty(exports, "useLabel", {
  enumerable: true,
  get: function () {
    return _useLabel.useLabel;
  }
});
Object.defineProperty(exports, "useLabelableContext", {
  enumerable: true,
  get: function () {
    return _LabelableContext.useLabelableContext;
  }
});
Object.defineProperty(exports, "useLabelableId", {
  enumerable: true,
  get: function () {
    return _useLabelableId.useLabelableId;
  }
});
var _LabelableProvider = require("./LabelableProvider");
Object.keys(_LabelableProvider).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _LabelableProvider[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _LabelableProvider[key];
    }
  });
});
var _useAriaLabelledBy = require("./useAriaLabelledBy");
var _LabelableContext = require("./LabelableContext");
var _useLabelableId = require("./useLabelableId");
var _useLabel = require("./useLabel");