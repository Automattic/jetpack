"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transitionStatusMapping = exports.TransitionStatusDataAttributes = void 0;
var TransitionStatusDataAttributes = _interopRequireWildcard(require("./TransitionStatusDataAttributes"));
exports.TransitionStatusDataAttributes = TransitionStatusDataAttributes;
const STARTING_HOOK = {
  [TransitionStatusDataAttributes.startingStyle]: ''
};
const ENDING_HOOK = {
  [TransitionStatusDataAttributes.endingStyle]: ''
};
const transitionStatusMapping = exports.transitionStatusMapping = {
  transitionStatus(value) {
    if (value === 'starting') {
      return STARTING_HOOK;
    }
    if (value === 'ending') {
      return ENDING_HOOK;
    }
    return null;
  }
};