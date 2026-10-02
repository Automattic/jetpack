"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stateAttributesMapping = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _constants = require("../../internals/field-constants/constants");
var RadioRootDataAttributes = _interopRequireWildcard(require("../root/RadioRootDataAttributes"));
const stateAttributesMapping = exports.stateAttributesMapping = {
  checked(value) {
    if (value) {
      return {
        [RadioRootDataAttributes.checked]: ''
      };
    }
    return {
      [RadioRootDataAttributes.unchecked]: ''
    };
  },
  ..._stateAttributesMapping.transitionStatusMapping,
  ..._constants.fieldValidityMapping
};