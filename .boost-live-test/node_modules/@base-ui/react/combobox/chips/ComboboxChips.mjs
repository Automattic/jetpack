'use client';

import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { ComboboxChipsContext } from "./ComboboxChipsContext.mjs";
import { CompositeList } from "../../internals/composite/list/CompositeList.mjs";
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { handleInputPress } from "../utils/handleInputPress.mjs";

/**
 * A container for the chips in a multiselectable input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ComboboxChips = /*#__PURE__*/React.forwardRef(function ComboboxChips(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = useComboboxRootContext();
  const open = store.useState('open');
  const hasSelectionChips = store.useState('hasSelectionChips');
  const [highlightedChipIndex, setHighlightedChipIndex] = React.useState(undefined);
  if (open && highlightedChipIndex !== undefined) {
    setHighlightedChipIndex(undefined);
  }
  const chipsRef = React.useRef([]);
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.context.chipsContainerRef],
    // NVDA enters browse mode instead of staying in focus mode when navigating with
    // arrow keys inside a container unless it has a toolbar role.
    props: [hasSelectionChips ? {
      role: 'toolbar'
    } : EMPTY_OBJECT, {
      onMouseDown(event) {
        handleInputPress(event, store, store.state.disabled);
      }
    }, elementProps]
  });
  const contextValue = React.useMemo(() => ({
    highlightedChipIndex,
    setHighlightedChipIndex,
    chipsRef
  }), [highlightedChipIndex, setHighlightedChipIndex, chipsRef]);
  return /*#__PURE__*/_jsx(ComboboxChipsContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/_jsx(CompositeList, {
      elementsRef: chipsRef,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") ComboboxChips.displayName = "ComboboxChips";