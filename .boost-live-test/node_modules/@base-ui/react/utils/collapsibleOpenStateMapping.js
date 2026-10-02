"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.triggerOpenStateMapping = exports.collapsibleOpenStateMapping = void 0;
var CollapsiblePanelDataAttributes = _interopRequireWildcard(require("../collapsible/panel/CollapsiblePanelDataAttributes"));
var CollapsibleTriggerDataAttributes = _interopRequireWildcard(require("../collapsible/trigger/CollapsibleTriggerDataAttributes"));
const PANEL_OPEN_HOOK = {
  [CollapsiblePanelDataAttributes.open]: ''
};
const PANEL_CLOSED_HOOK = {
  [CollapsiblePanelDataAttributes.closed]: ''
};
const triggerOpenStateMapping = exports.triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return {
        [CollapsibleTriggerDataAttributes.panelOpen]: ''
      };
    }
    return null;
  }
};
const collapsibleOpenStateMapping = exports.collapsibleOpenStateMapping = {
  open(value) {
    if (value) {
      return PANEL_OPEN_HOOK;
    }
    return PANEL_CLOSED_HOOK;
  }
};