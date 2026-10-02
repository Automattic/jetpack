'use client';

import * as React from 'react';
import { useSelectRootContext, useSelectRootPropsContext } from "../root/SelectRootContext.mjs";
import { useSelectPositionerContext } from "../positioner/SelectPositionerContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { styleDisableScrollbar } from "../../utils/styles.mjs";
import { LIST_FUNCTIONAL_STYLES } from "../popup/utils.mjs";

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectList = /*#__PURE__*/React.forwardRef(function SelectList(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = useSelectRootContext();
  const {
    multiple,
    readOnly
  } = useSelectRootPropsContext();
  const {
    alignItemWithTriggerActive
  } = useSelectPositionerContext();
  const hasScrollArrows = store.useState('hasScrollArrows');
  const openMethod = store.useState('openMethod');
  const id = store.useState('id');
  const defaultProps = {
    id: `${id}-list`,
    role: 'listbox',
    'aria-multiselectable': multiple || undefined,
    'aria-readonly': readOnly || undefined,
    onScroll(event) {
      store.context.scrollHandlerRef.current?.(event.currentTarget);
    },
    ...(alignItemWithTriggerActive && {
      style: LIST_FUNCTIONAL_STYLES
    }),
    className: hasScrollArrows && openMethod !== 'touch' ? styleDisableScrollbar.className : undefined
  };
  const setListElement = store.useStateSetter('listElement');
  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [defaultProps, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") SelectList.displayName = "SelectList";