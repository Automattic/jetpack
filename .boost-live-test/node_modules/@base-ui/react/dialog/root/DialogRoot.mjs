'use client';

import { fastComponent } from '@base-ui/utils/fastHooks';
import { useRenderDialogRoot } from "./useRenderDialogRoot.mjs";

/**
 * Groups all parts of the dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogRoot = fastComponent(function DialogRoot(props) {
  return useRenderDialogRoot('dialog', props);
});
if (process.env.NODE_ENV !== "production") DialogRoot.displayName = "DialogRoot";