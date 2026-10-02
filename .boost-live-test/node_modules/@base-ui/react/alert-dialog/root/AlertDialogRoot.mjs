'use client';

import { useRenderDialogRoot } from "../../dialog/root/useRenderDialogRoot.mjs";
/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogRoot(props) {
  return useRenderDialogRoot('alert-dialog', props);
}