"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerHandle = void 0;
exports.createDrawerHandle = createDrawerHandle;
var _DialogHandle = require("../dialog/store/DialogHandle");
/**
 * Controls a Drawer imperatively and associates detached `Drawer.Trigger` components with a
 * `Drawer.Root`. Create one with `Drawer.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
class DrawerHandle extends _DialogHandle.DialogHandle {}

/**
 * Creates a new handle to connect a Drawer.Root with detached Drawer.Trigger components.
 */
exports.DrawerHandle = DrawerHandle;
function createDrawerHandle() {
  return new DrawerHandle();
}