'use client';

import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import { useMenuRootContext } from "../root/MenuRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useMenuRadioGroupContext } from "../radio-group/MenuRadioGroupContext.mjs";
import { MenuRadioItemContext } from "./MenuRadioItemContext.mjs";
import { itemMapping } from "../utils/stateAttributesMapping.mjs";
import { useCompositeListItem } from "../../internals/composite/list/useCompositeListItem.mjs";
import { REGULAR_ITEM, useMenuItem } from "../item/useMenuItem.mjs";
import { useMenuPositionerContext } from "../positioner/MenuPositionerContext.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const MenuRadioItem = /*#__PURE__*/React.forwardRef(function MenuRadioItem(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled: disabledProp = false,
    closeOnClick = false,
    value,
    style,
    ...elementProps
  } = componentProps;
  const listItem = useCompositeListItem({
    guess: true,
    label
  });
  const menuPositionerContext = useMenuPositionerContext(true);
  const id = useBaseUiId(idProp);
  const {
    store
  } = useMenuRootContext();
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');
  const {
    value: selectedValue,
    setValue: setSelectedValue,
    disabled: groupDisabled
  } = useMenuRadioGroupContext();
  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp || groupDisabled || rootDisabled;
  const checked = selectedValue === value;
  const {
    getItemProps,
    itemRef
  } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    store,
    nativeButton,
    nodeId: menuPositionerContext?.context.nodeId,
    itemMetadata: REGULAR_ITEM
  });
  const state = React.useMemo(() => ({
    disabled,
    highlighted,
    checked
  }), [disabled, highlighted, checked]);
  function handleClick(event) {
    const details = createChangeEventDetails(REASONS.itemPress, event.nativeEvent, undefined, {
      preventUnmountOnClose: NOOP
    });
    setSelectedValue(value, details);
  }
  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: itemMapping,
    props: [itemProps, {
      role: 'menuitemradio',
      'aria-checked': checked,
      onClick: handleClick
    }, elementProps, getItemProps],
    ref: [itemRef, forwardedRef, listItem.ref]
  });
  return /*#__PURE__*/_jsx(MenuRadioItemContext.Provider, {
    value: state,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MenuRadioItem.displayName = "MenuRadioItem";