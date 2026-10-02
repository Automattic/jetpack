'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useAccordionItemContext } from "../item/AccordionItemContext.mjs";
import { accordionStateAttributesMapping } from "../item/stateAttributesMapping.mjs";

/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export const AccordionHeader = /*#__PURE__*/React.forwardRef(function AccordionHeader(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = useAccordionItemContext();
  const element = useRenderElement('h3', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: accordionStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") AccordionHeader.displayName = "AccordionHeader";