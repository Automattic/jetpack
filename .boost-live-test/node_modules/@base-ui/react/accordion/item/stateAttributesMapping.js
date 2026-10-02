"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.accordionStateAttributesMapping = void 0;
var _collapsibleOpenStateMapping = require("../../utils/collapsibleOpenStateMapping");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var AccordionItemDataAttributes = _interopRequireWildcard(require("./AccordionItemDataAttributes"));
const accordionStateAttributesMapping = exports.accordionStateAttributesMapping = {
  ..._collapsibleOpenStateMapping.collapsibleOpenStateMapping,
  index: value => ({
    [AccordionItemDataAttributes.index]: String(value)
  }),
  ..._stateAttributesMapping.transitionStatusMapping,
  value: () => null
};