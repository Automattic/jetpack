'use client';

import * as React from 'react';
import { useMenuCheckboxItemContext } from "../checkbox-item/MenuCheckboxItemContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { itemMapping } from "../utils/stateAttributesMapping.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";

/**
 * Indicates whether the checkbox item is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItemIndicator = /*#__PURE__*/React.forwardRef(function MenuCheckboxItemIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const item = useMenuCheckboxItemContext();
  const indicatorRef = React.useRef(null);
  const {
    transitionStatus,
    mounted,
    setMounted
  } = useTransitionStatus(item.checked);
  useOpenChangeComplete({
    batch: true,
    enabled: !item.checked,
    open: item.checked,
    ref: indicatorRef,
    onComplete() {
      if (!item.checked) {
        setMounted(false);
      }
    }
  });
  const state = {
    checked: item.checked,
    disabled: item.disabled,
    highlighted: item.highlighted,
    transitionStatus
  };
  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, indicatorRef],
    stateAttributesMapping: itemMapping,
    props: {
      'aria-hidden': true,
      ...elementProps
    },
    enabled: keepMounted || mounted
  });
  return element;
});
if (process.env.NODE_ENV !== "production") MenuCheckboxItemIndicator.displayName = "MenuCheckboxItemIndicator";