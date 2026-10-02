'use client';

import * as React from 'react';
import { DirectionContext } from "../internals/direction-context/DirectionContext.mjs";

/**
 * Enables RTL behavior for Base UI components.
 *
 * Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const DirectionProvider = function DirectionProvider(props) {
  const {
    direction = 'ltr'
  } = props;
  const contextValue = React.useMemo(() => ({
    direction
  }), [direction]);
  return /*#__PURE__*/_jsx(DirectionContext.Provider, {
    value: contextValue,
    children: props.children
  });
};
if (process.env.NODE_ENV !== "production") DirectionProvider.displayName = "DirectionProvider";