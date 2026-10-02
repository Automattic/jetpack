'use client';

import * as React from 'react';
import { SelectScrollArrow } from "../scroll-arrow/SelectScrollArrow.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * An element that scrolls the select popup down when hovered. Does not render when using touch input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectScrollDownArrow = /*#__PURE__*/React.forwardRef(function SelectScrollDownArrow(props, forwardedRef) {
  return /*#__PURE__*/_jsx(SelectScrollArrow, {
    ...props,
    ref: forwardedRef,
    direction: "down"
  });
});
if (process.env.NODE_ENV !== "production") SelectScrollDownArrow.displayName = "SelectScrollDownArrow";