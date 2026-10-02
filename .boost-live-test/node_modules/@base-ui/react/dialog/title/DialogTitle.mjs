'use client';

import * as React from 'react';
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTitle = /*#__PURE__*/React.forwardRef(function DialogTitle(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const store = useDialogRootContext();
  const id = useBaseUiId(idProp);
  store.useSyncedValueWithCleanup('titleElementId', id);
  return useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    props: [{
      id
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DialogTitle.displayName = "DialogTitle";