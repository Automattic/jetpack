'use client';

import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useButton } from "../../internals/use-button/index.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @internal
 */
export const ComboboxInternalDismissButton = /*#__PURE__*/React.forwardRef(function ComboboxInternalDismissButton(_, forwardedRef) {
  const store = useComboboxRootContext();
  const {
    buttonRef,
    getButtonProps
  } = useButton({
    native: false
  });
  const mergedRef = useMergedRefs(forwardedRef, buttonRef);
  function handleDismiss(event) {
    store.context.setOpen(false, createChangeEventDetails(REASONS.closePress, event.nativeEvent, event.currentTarget));
  }
  const dismissProps = getButtonProps({
    onClick: handleDismiss
  });
  return /*#__PURE__*/_jsx("span", {
    ref: mergedRef,
    ...dismissProps,
    "aria-label": "Dismiss",
    tabIndex: undefined,
    style: visuallyHiddenInput
  });
});
if (process.env.NODE_ENV !== "production") ComboboxInternalDismissButton.displayName = "ComboboxInternalDismissButton";