"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sliderStateAttributesMapping = void 0;
var _constants = require("../../internals/field-constants/constants");
const nullMapping = () => null;
const sliderStateAttributesMapping = exports.sliderStateAttributesMapping = {
  activeThumbIndex: nullMapping,
  max: nullMapping,
  min: nullMapping,
  minStepsBetweenValues: nullMapping,
  step: nullMapping,
  values: nullMapping,
  ..._constants.fieldValidityMapping
};