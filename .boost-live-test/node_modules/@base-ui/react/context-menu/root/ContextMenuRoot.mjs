'use client';

import * as React from 'react';
import { useId } from '@base-ui/utils/useId';
import { ContextMenuRootContext } from "./ContextMenuRootContext.mjs";
import { Menu } from "../../menu/index.mjs";
import { MenuRootContext } from "../../menu/root/MenuRootContext.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export function ContextMenuRoot(props) {
  const [anchor, setAnchor] = React.useState({
    getBoundingClientRect() {
      return DOMRect.fromRect({
        width: 0,
        height: 0,
        x: 0,
        y: 0
      });
    }
  });
  const backdropRef = React.useRef(null);
  const internalBackdropRef = React.useRef(null);
  const actionsRef = React.useRef(null);
  const positionerRef = React.useRef(null);
  const allowMouseUpTriggerRef = React.useRef(true);
  const initialCursorPointRef = React.useRef(null);
  const id = useId();
  const contextValue = React.useMemo(() => ({
    anchor,
    setAnchor,
    actionsRef,
    backdropRef,
    internalBackdropRef,
    positionerRef,
    allowMouseUpTriggerRef,
    initialCursorPointRef,
    rootId: id
  }), [anchor, id]);
  return /*#__PURE__*/_jsx(ContextMenuRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/_jsx(MenuRootContext.Provider, {
      value: undefined,
      children: /*#__PURE__*/_jsx(Menu.Root, {
        ...props
      })
    })
  });
}