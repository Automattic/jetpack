"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogRoot = void 0;
var _fastHooks = require("@base-ui/utils/fastHooks");
var _useRenderDialogRoot = require("./useRenderDialogRoot");
/**
 * Groups all parts of the dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogRoot = exports.DialogRoot = (0, _fastHooks.fastComponent)(function DialogRoot(props) {
  return (0, _useRenderDialogRoot.useRenderDialogRoot)('dialog', props);
});
if (process.env.NODE_ENV !== "production") DialogRoot.displayName = "DialogRoot";