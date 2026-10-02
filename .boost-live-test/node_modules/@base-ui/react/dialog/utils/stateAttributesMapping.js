"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dialogStateAttributesMapping = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _popupStateMapping = require("../../utils/popupStateMapping");
var DialogPopupDataAttributes = _interopRequireWildcard(require("../popup/DialogPopupDataAttributes"));
/**
 * Shared by `Dialog.Popup` and `Dialog.Viewport`, whose states have the same shape.
 * `nested` is not mapped: unmapped `true` booleans already render as `data-nested`.
 */
const dialogStateAttributesMapping = exports.dialogStateAttributesMapping = {
  ..._popupStateMapping.popupStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping,
  nestedDialogOpen(value) {
    return value ? {
      [DialogPopupDataAttributes.nestedDialogOpen]: ''
    } : null;
  }
};