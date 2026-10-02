'use client';

import * as React from 'react';
import { triggerOpenStateMapping } from "../../utils/collapsibleOpenStateMapping.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useButton } from "../../internals/use-button/index.mjs";
import { useCollapsibleRootContext } from "../root/CollapsibleRootContext.mjs";
const stateAttributesMapping = {
  ...triggerOpenStateMapping,
  ...transitionStatusMapping
};

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export const CollapsibleTrigger = /*#__PURE__*/React.forwardRef(function CollapsibleTrigger(componentProps, forwardedRef) {
  const {
    panelId,
    open,
    handleTrigger,
    state,
    disabled: contextDisabled
  } = useCollapsibleRootContext();
  const {
    className,
    disabled = contextDisabled,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton
  });
  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [{
      'aria-controls': open ? panelId : undefined,
      'aria-expanded': open,
      onClick: handleTrigger
    }, elementProps, getButtonProps],
    stateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") CollapsibleTrigger.displayName = "CollapsibleTrigger";