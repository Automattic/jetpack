import { DialogHandle } from "../dialog/store/DialogHandle.mjs";

/**
 * Controls a Drawer imperatively and associates detached `Drawer.Trigger` components with a
 * `Drawer.Root`. Create one with `Drawer.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class DrawerHandle extends DialogHandle {}

/**
 * Creates a new handle to connect a Drawer.Root with detached Drawer.Trigger components.
 */
export function createDrawerHandle() {
  return new DrawerHandle();
}