'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { triggerOpenStateMapping } from "../../utils/collapsibleOpenStateMapping.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { useCollapsibleRootContext } from "../../collapsible/root/CollapsibleRootContext.mjs";
import { useAccordionItemContext } from "../item/AccordionItemContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */

export const AccordionTrigger = /*#__PURE__*/React.forwardRef(function AccordionTrigger(componentProps, forwardedRef) {
  const {
    disabled: disabledProp,
    className,
    id: idProp,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    panelId,
    open,
    handleTrigger,
    disabled: contextDisabled
  } = useCollapsibleRootContext();
  const disabled = disabledProp || contextDisabled;
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton
  });
  const {
    defaultTriggerId,
    state,
    setTriggerId
  } = useAccordionItemContext();
  const registeredId = idProp || undefined;
  const id = registeredId ?? defaultTriggerId;
  useIsoLayoutEffect(() => {
    setTriggerId(currentId => registeredId ?? (currentId === null ? undefined : currentId));
    return () => {
      setTriggerId(currentId => currentId === registeredId ? null : currentId);
    };
  }, [registeredId, setTriggerId]);
  const props = {
    'aria-controls': open ? panelId : undefined,
    'aria-expanded': open,
    id,
    onClick: handleTrigger
  };
  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping: triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") AccordionTrigger.displayName = "AccordionTrigger";