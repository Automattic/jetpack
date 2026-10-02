"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AlertDialogHandle = void 0;
exports.createAlertDialogHandle = createAlertDialogHandle;
var _DialogHandle = require("../dialog/store/DialogHandle");
/**
 * Controls an Alert Dialog imperatively and associates detached `AlertDialog.Trigger` components with
 * an `AlertDialog.Root`. Create one with `AlertDialog.createHandle()` and pass it to the `handle`
 * prop of the root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
class AlertDialogHandle extends _DialogHandle.DialogHandle {}

/**
 * Creates a new handle to connect an AlertDialog.Root with detached AlertDialog.Trigger components.
 */
exports.AlertDialogHandle = AlertDialogHandle;
function createAlertDialogHandle() {
  return new AlertDialogHandle();
}