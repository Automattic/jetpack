'use client';

import * as React from 'react';
import { SelectGroupContext } from "./SelectGroupContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const SelectGroup = /*#__PURE__*/React.forwardRef(function SelectGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState();
  const contextValue = React.useMemo(() => ({
    labelId,
    setLabelId
  }), [labelId, setLabelId]);
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{
      role: 'group',
      'aria-labelledby': labelId
    }, elementProps]
  });
  return /*#__PURE__*/_jsx(SelectGroupContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") SelectGroup.displayName = "SelectGroup";