"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collapsibleStateAttributesMapping = void 0;
var _collapsibleOpenStateMapping = require("../../utils/collapsibleOpenStateMapping");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
const collapsibleStateAttributesMapping = exports.collapsibleStateAttributesMapping = {
  ..._collapsibleOpenStateMapping.collapsibleOpenStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};