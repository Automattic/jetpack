'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useToastLabelElement, useToastLabelPart } from "../utils/useToastLabelPart.mjs";

/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastDescription = /*#__PURE__*/React.forwardRef(function ToastDescription(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    children: childrenProp,
    ...elementProps
  } = componentProps;
  const {
    id,
    children,
    type,
    setId
  } = useToastLabelPart(idProp, childrenProp, 'description');
  const state = {
    type
  };
  const element = useRenderElement('p', componentProps, {
    ref: forwardedRef,
    state,
    props: {
      ...elementProps,
      id,
      children
    }
  });
  return useToastLabelElement(element, id, setId);
});
if (process.env.NODE_ENV !== "production") ToastDescription.displayName = "ToastDescription";