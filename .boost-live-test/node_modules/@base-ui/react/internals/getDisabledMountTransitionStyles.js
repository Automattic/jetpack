"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDisabledMountTransitionStyles = getDisabledMountTransitionStyles;
var _empty = require("@base-ui/utils/empty");
var _constants = require("./constants");
function getDisabledMountTransitionStyles(transitionStatus) {
  return transitionStatus === 'starting' ? _constants.DISABLED_TRANSITIONS_STYLE : _empty.EMPTY_OBJECT;
}