"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AutocompleteRoot = AutocompleteRoot;
var React = _interopRequireWildcard(require("react"));
var _AriaCombobox = require("../../combobox/root/AriaCombobox");
var _useFilter = require("../../combobox/root/utils/useFilter");
var _resolveValueLabel = require("../../internals/resolveValueLabel");
var _reasons = require("../../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */

function AutocompleteRoot(props) {
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
  const collator = (0, _useFilter.useCoreFilter)({
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
    if (eventDetails.reason === _reasons.REASONS.pointer) {
      return;
    }
    setInlineInputValue(enableInline && highlightedValue != null ? (0, _resolveValueLabel.stringifyAsLabel)(highlightedValue, itemToStringValue) : '');
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_AriaCombobox.AriaCombobox, {
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