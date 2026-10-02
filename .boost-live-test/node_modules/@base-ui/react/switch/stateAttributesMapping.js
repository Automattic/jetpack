"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stateAttributesMapping = void 0;
var _constants = require("../internals/field-constants/constants");
var SwitchRootDataAttributes = _interopRequireWildcard(require("./root/SwitchRootDataAttributes"));
const stateAttributesMapping = exports.stateAttributesMapping = {
  ..._constants.fieldValidityMapping,
  checked(value) {
    if (value) {
      return {
        [SwitchRootDataAttributes.checked]: ''
      };
    }
    return {
      [SwitchRootDataAttributes.unchecked]: ''
    };
  }
};