"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.triggerStateAttributesMapping = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
var _constants = require("../../internals/field-constants/constants");
var ComboboxInputDataAttributes = _interopRequireWildcard(require("../input/ComboboxInputDataAttributes"));
const triggerStateAttributesMapping = exports.triggerStateAttributesMapping = {
  ..._popupStateMapping.pressableTriggerOpenStateMapping,
  ..._constants.fieldValidityMapping,
  popupSide: side => side ? {
    [ComboboxInputDataAttributes.popupSide]: side
  } : null,
  listEmpty: empty => empty ? {
    [ComboboxInputDataAttributes.listEmpty]: ''
  } : null
};