'use client';

import * as React from 'react';
import { CompositeRoot } from "../../internals/composite/root/CompositeRoot.mjs";
import { ToolbarRootContext } from "./ToolbarRootContext.mjs";

/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ToolbarRoot = /*#__PURE__*/React.forwardRef(function ToolbarRoot(componentProps, forwardedRef) {
  const {
    disabled = false,
    loopFocus,
    orientation = 'horizontal',
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const [itemMap, setItemMap] = React.useState(() => new Map());
  const disabledIndices = React.useMemo(() => {
    const output = [];
    for (const itemMetadata of itemMap.values()) {
      // Only items that are disabled and not focusable when disabled
      // are removed from roving focus.
      if (itemMetadata.disabled && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  }, [itemMap]);
  const toolbarRootContext = React.useMemo(() => ({
    disabled,
    orientation
  }), [disabled, orientation]);
  const state = {
    disabled,
    orientation
  };
  const defaultProps = {
    'aria-orientation': orientation,
    role: 'toolbar'
  };
  return /*#__PURE__*/_jsx(ToolbarRootContext.Provider, {
    value: toolbarRootContext,
    children: /*#__PURE__*/_jsx(CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef],
      props: [defaultProps, elementProps],
      disabledIndices: disabledIndices,
      loopFocus: loopFocus,
      onMapChange: setItemMap,
      orientation: orientation
    })
  });
});
if (process.env.NODE_ENV !== "production") ToolbarRoot.displayName = "ToolbarRoot";