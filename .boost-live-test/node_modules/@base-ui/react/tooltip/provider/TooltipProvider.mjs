'use client';

import * as React from 'react';
import { FloatingDelayGroup } from "../../floating-ui-react/index.mjs";
import { TooltipProviderContext } from "./TooltipProviderContext.mjs";

/**
 * Provides a shared delay for multiple tooltips. The grouping logic ensures that
 * once a tooltip becomes visible, the adjacent tooltips will be shown instantly.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const TooltipProvider = function TooltipProvider(props) {
  const {
    delay,
    closeDelay,
    timeout = 400
  } = props;
  const delayValue = React.useMemo(() => ({
    open: delay,
    close: closeDelay
  }), [delay, closeDelay]);
  return /*#__PURE__*/_jsx(TooltipProviderContext.Provider, {
    value: delay,
    children: /*#__PURE__*/_jsx(FloatingDelayGroup, {
      delay: delayValue,
      timeoutMs: timeout,
      children: props.children
    })
  });
};
if (process.env.NODE_ENV !== "production") TooltipProvider.displayName = "TooltipProvider";