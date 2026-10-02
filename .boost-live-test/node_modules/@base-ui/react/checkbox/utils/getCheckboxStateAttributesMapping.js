"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCheckboxStateAttributesMapping = getCheckboxStateAttributesMapping;
var _constants = require("../../internals/field-constants/constants");
var CheckboxRootDataAttributes = _interopRequireWildcard(require("../root/CheckboxRootDataAttributes"));
function getCheckboxStateAttributesMapping(state) {
  return {
    checked(value) {
      if (state.indeterminate) {
        // `data-indeterminate` is already handled by the `indeterminate` prop.
        return {};
      }
      if (value) {
        return {
          [CheckboxRootDataAttributes.checked]: ''
        };
      }
      return {
        [CheckboxRootDataAttributes.unchecked]: ''
      };
    },
    ..._constants.fieldValidityMapping
  };
}