'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useToastLabelElement, useToastLabelPart } from "../utils/useToastLabelPart.mjs";

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastTitle = /*#__PURE__*/React.forwardRef(function ToastTitle(componentProps, forwardedRef) {
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
  } = useToastLabelPart(idProp, childrenProp, 'title');
  const state = {
    type
  };
  const element = useRenderElement('h2', componentProps, {
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
if (process.env.NODE_ENV !== "production") ToastTitle.displayName = "ToastTitle";