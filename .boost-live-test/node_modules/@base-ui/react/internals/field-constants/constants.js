"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fieldValidityMapping = exports.DEFAULT_VALIDITY_STATE = exports.DEFAULT_FIELD_STATE_ATTRIBUTES = exports.DEFAULT_FIELD_ROOT_STATE = void 0;
var FieldControlDataAttributes = _interopRequireWildcard(require("../../field/control/FieldControlDataAttributes"));
const DEFAULT_VALIDITY_STATE = exports.DEFAULT_VALIDITY_STATE = {
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: null,
  valueMissing: false
};
const DEFAULT_FIELD_STATE_ATTRIBUTES = exports.DEFAULT_FIELD_STATE_ATTRIBUTES = {
  valid: null,
  touched: false,
  dirty: false,
  filled: false,
  focused: false
};
const DEFAULT_FIELD_ROOT_STATE = exports.DEFAULT_FIELD_ROOT_STATE = {
  disabled: false,
  ...DEFAULT_FIELD_STATE_ATTRIBUTES
};
const fieldValidityMapping = exports.fieldValidityMapping = {
  valid(value) {
    if (value === null) {
      return null;
    }
    if (value) {
      return {
        [FieldControlDataAttributes.valid]: ''
      };
    }
    return {
      [FieldControlDataAttributes.invalid]: ''
    };
  }
};