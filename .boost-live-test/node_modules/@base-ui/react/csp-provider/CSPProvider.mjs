'use client';

import * as React from 'react';
import { CSPContext } from "../internals/csp-context/CSPContext.mjs";

/**
 * Provides a default Content Security Policy (CSP) configuration for Base UI components that
 * require inline `<style>` or `<script>` tags.
 *
 * Documentation: [Base UI CSP Provider](https://base-ui.com/react/utils/csp-provider)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export function CSPProvider(props) {
  const {
    children,
    nonce,
    disableStyleElements
  } = props;
  const contextValue = React.useMemo(() => ({
    nonce,
    disableStyleElements
  }), [nonce, disableStyleElements]);
  return /*#__PURE__*/_jsx(CSPContext.Provider, {
    value: contextValue,
    children: children
  });
}