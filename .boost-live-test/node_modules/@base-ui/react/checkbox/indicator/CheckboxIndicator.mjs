'use client';

import * as React from 'react';
import { useCheckboxRootContext } from "../root/CheckboxRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { getCheckboxStateAttributesMapping } from "../utils/getCheckboxStateAttributesMapping.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxIndicator = /*#__PURE__*/React.forwardRef(function CheckboxIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const rootState = useCheckboxRootContext();
  const rendered = rootState.checked || rootState.indeterminate;
  const {
    mounted,
    transitionStatus,
    setMounted
  } = useTransitionStatus(rendered);
  const indicatorRef = React.useRef(null);
  const state = {
    ...rootState,
    transitionStatus
  };
  useOpenChangeComplete({
    batch: true,
    enabled: !rendered,
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    }
  });
  const baseStateAttributesMapping = getCheckboxStateAttributesMapping(rootState);
  const stateAttributesMapping = {
    ...baseStateAttributesMapping,
    ...transitionStatusMapping
  };
  const shouldRender = keepMounted || mounted;
  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    stateAttributesMapping,
    props: elementProps
  });
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") CheckboxIndicator.displayName = "CheckboxIndicator";