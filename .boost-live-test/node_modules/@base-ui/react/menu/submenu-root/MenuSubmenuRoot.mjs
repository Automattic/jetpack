'use client';

import * as React from 'react';
import { MenuRoot } from "../root/MenuRoot.mjs";
import { useMenuRootContext } from "../root/MenuRootContext.mjs";
import { MenuSubmenuRootContext } from "./MenuSubmenuRootContext.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
export { useMenuSubmenuRootContext } from "./MenuSubmenuRootContext.mjs";

/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuRoot(props) {
  const parentMenu = useMenuRootContext().store;
  const contextValue = React.useMemo(() => ({
    parentMenu
  }), [parentMenu]);
  return /*#__PURE__*/_jsx(MenuSubmenuRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/_jsx(MenuRoot, {
      ...props
    })
  });
}