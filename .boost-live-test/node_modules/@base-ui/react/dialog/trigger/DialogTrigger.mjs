'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { useButton } from "../../internals/use-button/useButton.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
import { CLICK_TRIGGER_IDENTIFIER } from "../../internals/constants.mjs";
import { usePopupHandleStore, useTriggerDataForwarding } from "../../utils/popups/index.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useClick } from "../../floating-ui-react/index.mjs";
import { useOpenMethodTriggerProps } from "../../utils/useOpenInteractionType.mjs";

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTrigger = fastComponentRef(function DialogTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled = false,
    nativeButton = true,
    id: idProp,
    payload,
    handle,
    ...elementProps
  } = componentProps;
  const dialogRootStore = useDialogRootContext(true);
  const handleStore = usePopupHandleStore(handle);
  const store = handleStore ?? dialogRootStore;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Dialog.Trigger> must be used within <Dialog.Root> or provided with a handle.' : _formatErrorMessage(79));
  }
  const thisTriggerId = useBaseUiId(idProp);
  const floatingContext = store.useState('floatingRootContext');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const popupId = store.useState('triggerPopupId', thisTriggerId);
  const triggerElementRef = React.useRef(null);
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
    payload
  });
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton
  });
  const click = useClick(floatingContext);
  const interactionTypeProps = useOpenMethodTriggerProps(() => store.select('open'), interactionType => {
    store.set('openMethod', interactionType);
  });
  const state = {
    disabled,
    open: isOpenedByThisTrigger
  };
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  return useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger, triggerElementRef],
    props: [click.reference, rootTriggerProps, interactionTypeProps, {
      [CLICK_TRIGGER_IDENTIFIER]: '',
      id: thisTriggerId,
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpenedByThisTrigger,
      'aria-controls': popupId
    }, elementProps, getButtonProps],
    stateAttributesMapping: triggerOpenStateMapping
  });
});
if (process.env.NODE_ENV !== "production") DialogTrigger.displayName = "DialogTrigger";