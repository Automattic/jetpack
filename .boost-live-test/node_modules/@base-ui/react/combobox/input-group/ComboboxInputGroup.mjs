'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { triggerStateAttributesMapping } from "../utils/stateAttributesMapping.mjs";
import { handleInputPress } from "../utils/handleInputPress.mjs";
import { useListEmpty, usePopupSide } from "../utils/parts.mjs";
import { contains } from "../../floating-ui-react/utils/element.mjs";

/**
 * A wrapper for the input and its associated controls.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxInputGroup = /*#__PURE__*/React.forwardRef(function ComboboxInputGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState
  } = useFieldRootContext();
  const store = useComboboxRootContext();
  const open = store.useState('open');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const hasSelectedValue = store.useState('hasSelectedValue');
  const selectionMode = store.useState('selectionMode');
  const popupSide = usePopupSide(store);
  const disabled = comboboxDisabled;
  const listEmpty = useListEmpty();
  const placeholder = selectionMode === 'none' ? false : !hasSelectedValue;
  const state = {
    ...fieldState,
    open,
    disabled,
    readOnly,
    popupSide,
    listEmpty,
    placeholder
  };
  const setInputGroupElement = useStableCallback(element => {
    store.set('inputGroupElement', element);
  });
  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setInputGroupElement],
    props: [{
      role: 'group',
      onMouseDown(event) {
        handleInputPress(event, store, disabled, target => {
          return contains(store.context.chipsContainerRef.current, target);
        });
      }
    }, elementProps],
    state,
    stateAttributesMapping: triggerStateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") ComboboxInputGroup.displayName = "ComboboxInputGroup";