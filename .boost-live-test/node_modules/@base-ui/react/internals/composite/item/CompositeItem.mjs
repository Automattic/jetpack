'use client';

import { EMPTY_OBJECT, EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useRenderElement } from "../../useRenderElement.mjs";
import { useCompositeItem } from "./useCompositeItem.mjs";
export function CompositeItem(componentProps) {
  const {
    render,
    className,
    style,
    state = EMPTY_OBJECT,
    props = EMPTY_ARRAY,
    refs = EMPTY_ARRAY,
    metadata,
    stateAttributesMapping,
    tag = 'div',
    ...elementProps
  } = componentProps;
  const {
    compositeProps,
    compositeRef
  } = useCompositeItem({
    metadata
  });
  return useRenderElement(tag, componentProps, {
    state,
    // The composite ref attaches first so an outer item wins when nested items share a DOM node.
    ref: [compositeRef, ...refs],
    props: [compositeProps, ...props, elementProps],
    stateAttributesMapping
  });
}