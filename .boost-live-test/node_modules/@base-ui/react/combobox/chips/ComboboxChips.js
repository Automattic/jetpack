"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxChips = void 0;
var React = _interopRequireWildcard(require("react"));
var _empty = require("@base-ui/utils/empty");
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxChipsContext = require("./ComboboxChipsContext");
var _CompositeList = require("../../internals/composite/list/CompositeList");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _handleInputPress = require("../utils/handleInputPress");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A container for the chips in a multiselectable input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxChips = exports.ComboboxChips = /*#__PURE__*/React.forwardRef(function ComboboxChips(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const open = store.useState('open');
  const hasSelectionChips = store.useState('hasSelectionChips');
  const [highlightedChipIndex, setHighlightedChipIndex] = React.useState(undefined);
  if (open && highlightedChipIndex !== undefined) {
    setHighlightedChipIndex(undefined);
  }
  const chipsRef = React.useRef([]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, store.context.chipsContainerRef],
    // NVDA enters browse mode instead of staying in focus mode when navigating with
    // arrow keys inside a container unless it has a toolbar role.
    props: [hasSelectionChips ? {
      role: 'toolbar'
    } : _empty.EMPTY_OBJECT, {
      onMouseDown(event) {
        (0, _handleInputPress.handleInputPress)(event, store, store.state.disabled);
      }
    }, elementProps]
  });
  const contextValue = React.useMemo(() => ({
    highlightedChipIndex,
    setHighlightedChipIndex,
    chipsRef
  }), [highlightedChipIndex, setHighlightedChipIndex, chipsRef]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxChipsContext.ComboboxChipsContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeList.CompositeList, {
      elementsRef: chipsRef,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") ComboboxChips.displayName = "ComboboxChips";