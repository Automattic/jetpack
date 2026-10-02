'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { MenuGroupContext } from "./MenuGroupContext.mjs";

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const MenuGroup = /*#__PURE__*/React.forwardRef(function MenuGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState(undefined);
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: {
      role: 'group',
      'aria-labelledby': labelId,
      ...elementProps
    }
  });
  return /*#__PURE__*/_jsx(MenuGroupContext.Provider, {
    value: setLabelId,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MenuGroup.displayName = "MenuGroup";