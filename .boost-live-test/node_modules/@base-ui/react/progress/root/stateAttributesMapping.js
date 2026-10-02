"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.progressStateAttributesMapping = void 0;
var ProgressRootDataAttributes = _interopRequireWildcard(require("./ProgressRootDataAttributes"));
const progressStateAttributesMapping = exports.progressStateAttributesMapping = {
  status(value) {
    if (value === 'progressing') {
      return {
        [ProgressRootDataAttributes.progressing]: ''
      };
    }
    if (value === 'complete') {
      return {
        [ProgressRootDataAttributes.complete]: ''
      };
    }
    if (value === 'indeterminate') {
      return {
        [ProgressRootDataAttributes.indeterminate]: ''
      };
    }
    return null;
  }
};