"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tabsStateAttributesMapping = void 0;
var TabsRootDataAttributes = _interopRequireWildcard(require("./TabsRootDataAttributes"));
const tabsStateAttributesMapping = exports.tabsStateAttributesMapping = {
  tabActivationDirection: dir => ({
    [TabsRootDataAttributes.activationDirection]: dir
  })
};