"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AlertDialogRoot = AlertDialogRoot;
var _useRenderDialogRoot = require("../../dialog/root/useRenderDialogRoot");
/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
function AlertDialogRoot(props) {
  return (0, _useRenderDialogRoot.useRenderDialogRoot)('alert-dialog', props);
}