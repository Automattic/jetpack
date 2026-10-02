"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rootStateAttributesMapping = exports.inputStateAttributesMapping = void 0;
var _constants = require("../../internals/field-constants/constants");
const rootStateAttributesMapping = exports.rootStateAttributesMapping = {
  value: () => null,
  length: () => null,
  ..._constants.fieldValidityMapping
};
const inputStateAttributesMapping = exports.inputStateAttributesMapping = {
  value: () => null,
  index: () => null,
  ..._constants.fieldValidityMapping
};