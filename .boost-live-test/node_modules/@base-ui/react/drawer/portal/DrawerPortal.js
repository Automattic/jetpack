"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerPortal = void 0;
var _DialogPortal = require("../../dialog/portal/DialogPortal");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerPortal = exports.DrawerPortal = _DialogPortal.DialogPortal;