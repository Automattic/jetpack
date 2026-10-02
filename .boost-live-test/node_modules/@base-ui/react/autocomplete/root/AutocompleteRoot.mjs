'use client';

import * as React from 'react';
import { AriaCombobox } from "../../combobox/root/AriaCombobox.mjs";
import { useCoreFilter } from "../../combobox/root/utils/useFilter.mjs";
import { stringifyAsLabel } from "../../internals/resolveValueLabel.mjs";
import { REASONS } from "../../internals/reasons.mjs";

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export function AutocompleteRoot(props) {
  const {
    openOnInputClick = false,
    value,
    defaultValue,
    onValueChange,
    mode = 'list',
    itemToStringValue,
    ...other
  } = props;

  // Inline completion writes the highlighted label into the input, which `readOnly` must prevent.
  const enableInline = (mode === 'inline' || mode === 'both') && !props.readOnly;
  const staticItems = mode === 'inline' || mode === 'none';

  // Mirror the typed value for uncontrolled usage so we can compose the temporary
  // inline input value.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const [inlineInputValue, setInlineInputValue] = React.useState('');
  React.useEffect(() => {
    if (isControlled || !enableInline) {
      setInlineInputValue('');
    }
  }, [value, isControlled, enableInline]);

  // Compose the input value shown to the user: inline value takes precedence when present.
  let resolvedInputValue;
  if (enableInline && inlineInputValue !== '') {
    resolvedInputValue = inlineInputValue;
  } else if (isControlled) {
    resolvedInputValue = value ?? '';
  } else {
    resolvedInputValue = internalValue;
  }
  const collator = useCoreFilter({
    locale: other.locale
  });
  const resolvedQuery = String((isControlled ? value : internalValue) ?? '').trim();
  const resolvedFilter = staticItems || other.filter === null ? null : other.filter ?? collator.contains;
  function handleValueChange(nextValue, eventDetails) {
    setInlineInputValue('');
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue, eventDetails);
  }
  function handleItemHighlighted(highlightedValue, eventDetails) {
    props.onItemHighlighted?.(highlightedValue, eventDetails);
    if (eventDetails.reason === REASONS.pointer) {
      return;
    }
    setInlineInputValue(enableInline && highlightedValue != null ? stringifyAsLabel(highlightedValue, itemToStringValue) : '');
  }
  return /*#__PURE__*/_jsx(AriaCombobox, {
    ...other,
    itemToStringLabel: itemToStringValue,
    openOnInputClick: openOnInputClick,
    selectionMode: "none",
    fillInputOnItemPress: true,
    filter: resolvedFilter,
    filterQuery:
    // Inline completion temporarily changes the displayed input without changing this query.
    mode === 'both' ? resolvedQuery : undefined,
    autoComplete: mode,
    inputValue: resolvedInputValue,
    defaultInputValue: defaultValue,
    onInputValueChange: handleValueChange,
    onItemHighlighted: handleItemHighlighted
  });
}