'use client';

import * as React from 'react';
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogDescription = /*#__PURE__*/React.forwardRef(function DialogDescription(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const store = useDialogRootContext();
  const id = useBaseUiId(idProp);
  store.useSyncedValueWithCleanup('descriptionElementId', id);
  return useRenderElement('p', componentProps, {
    ref: forwardedRef,
    props: [{
      id
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DialogDescription.displayName = "DialogDescription";