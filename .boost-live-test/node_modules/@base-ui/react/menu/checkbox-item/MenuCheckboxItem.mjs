'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { NOOP } from '@base-ui/utils/empty';
import { MenuCheckboxItemContext } from "./MenuCheckboxItemContext.mjs";
import { REGULAR_ITEM, useMenuItem } from "../item/useMenuItem.mjs";
import { useCompositeListItem } from "../../internals/composite/list/useCompositeListItem.mjs";
import { useMenuRootContext } from "../root/MenuRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { itemMapping } from "../utils/stateAttributesMapping.mjs";
import { useMenuPositionerContext } from "../positioner/MenuPositionerContext.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItem = /*#__PURE__*/React.forwardRef(function MenuCheckboxItem(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled: disabledProp = false,
    closeOnClick = false,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
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
  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp || rootDisabled;
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');
  const [checked, setChecked] = useControlled({
    controlled: checkedProp,
    default: defaultChecked ?? false,
    name: 'MenuCheckboxItem',
    state: 'checked'
  });
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
    onCheckedChange?.(!checked, details);
    if (details.isCanceled) {
      return;
    }
    setChecked(currentlyChecked => !currentlyChecked);
  }
  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: itemMapping,
    props: [itemProps, {
      role: 'menuitemcheckbox',
      'aria-checked': checked,
      onClick: handleClick
    }, elementProps, getItemProps],
    ref: [itemRef, forwardedRef, listItem.ref]
  });
  return /*#__PURE__*/_jsx(MenuCheckboxItemContext.Provider, {
    value: state,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MenuCheckboxItem.displayName = "MenuCheckboxItem";