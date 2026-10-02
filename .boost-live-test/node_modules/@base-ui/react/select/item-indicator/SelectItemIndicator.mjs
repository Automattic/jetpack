'use client';

import * as React from 'react';
import { useSelectItemContext } from "../item/SelectItemContext.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";

/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const SelectItemIndicator = /*#__PURE__*/React.forwardRef(function SelectItemIndicator(componentProps, forwardedRef) {
  const {
    selected
  } = useSelectItemContext();
  const shouldRender = componentProps.keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return /*#__PURE__*/_jsx(Inner, {
    ...componentProps,
    ref: forwardedRef
  });
});

// Split the core implementation to avoid paying the hook costs unless the element needs to mount.
if (process.env.NODE_ENV !== "production") SelectItemIndicator.displayName = "SelectItemIndicator";
const Inner = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef((componentProps, forwardedRef) => {
  const {
    render,
    className,
    style,
    keepMounted,
    ...elementProps
  } = componentProps;
  const {
    selected
  } = useSelectItemContext();
  const indicatorRef = React.useRef(null);
  const {
    transitionStatus,
    setMounted
  } = useTransitionStatus(selected);
  const state = {
    selected,
    transitionStatus
  };
  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    props: [{
      'aria-hidden': true,
      children: '✔️'
    }, elementProps],
    stateAttributesMapping: transitionStatusMapping
  });
  useOpenChangeComplete({
    batch: true,
    enabled: !selected,
    open: selected,
    ref: indicatorRef,
    onComplete() {
      if (!selected) {
        setMounted(false);
      }
    }
  });
  return element;
}));
if (process.env.NODE_ENV !== "production") Inner.displayName = "Inner";