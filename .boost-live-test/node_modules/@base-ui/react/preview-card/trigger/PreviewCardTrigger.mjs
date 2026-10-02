'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { usePreviewCardRootContext } from "../root/PreviewCardContext.mjs";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { getInlineRectTriggerProps, usePopupHandleStore, useTriggerDataForwarding } from "../../utils/popups/index.mjs";
import { CLOSE_DELAY, OPEN_DELAY } from "../utils/constants.mjs";
import { safePolygon, useFocus, useHoverReferenceInteraction } from "../../floating-ui-react/index.mjs";

/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardTrigger = fastComponentRef(function PreviewCardTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    delay,
    closeDelay,
    id: idProp,
    payload,
    handle,
    style,
    ...elementProps
  } = componentProps;
  const rootContext = usePreviewCardRootContext(true);
  const handleStore = usePopupHandleStore(handle);
  const store = handleStore ?? rootContext;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <PreviewCard.Trigger> must be either used within a <PreviewCard.Root> component or provided with a handle.' : _formatErrorMessage(89));
  }
  const thisTriggerId = useBaseUiId(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');
  const inlineRectCoordsRef = store.context.inlineRectCoordsRef;
  const triggerElementRef = React.useRef(null);
  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? CLOSE_DELAY;
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
    payload,
    closeDelay: closeDelayWithDefault
  });
  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    delay: () => ({
      open: delayWithDefault,
      close: closeDelayWithDefault
    }),
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
    isClosing: () => store.select('transitionStatus') === 'ending'
  });
  const focusProps = useFocus(floatingRootContext, {
    delay: delayWithDefault
  });
  const state = {
    open: isOpenedByThisTrigger
  };
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  const inlineRectTriggerProps = getInlineRectTriggerProps(inlineRectCoordsRef, isOpenedByThisTrigger);
  const element = useRenderElement('a', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    props: [hoverProps, focusProps.reference, rootTriggerProps, inlineRectTriggerProps, {
      id: thisTriggerId
    }, elementProps],
    stateAttributesMapping: triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PreviewCardTrigger.displayName = "PreviewCardTrigger";