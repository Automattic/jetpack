"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.itemMapping = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var MenuCheckboxItemDataAttributes = _interopRequireWildcard(require("../checkbox-item/MenuCheckboxItemDataAttributes"));
const itemMapping = exports.itemMapping = {
  checked(value) {
    if (value) {
      return {
        [MenuCheckboxItemDataAttributes.checked]: ''
      };
    }
    return {
      [MenuCheckboxItemDataAttributes.unchecked]: ''
    };
  },
  ..._stateAttributesMapping.transitionStatusMapping
};