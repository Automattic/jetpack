"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxGroupContext = require("./ComboboxGroupContext");
var _GroupCollectionContext = require("../collection/GroupCollectionContext");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxGroup = exports.ComboboxGroup = /*#__PURE__*/React.forwardRef(function ComboboxGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    items,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const grid = store.useState('grid');
  const [labelId, setLabelId] = React.useState();
  const contextValue = React.useMemo(() => ({
    labelId,
    setLabelId,
    items
  }), [labelId, setLabelId, items]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: [{
      // `group` is not a valid owned element of `grid`, and `row` must be owned
      // by `grid`, `rowgroup`, or `treegrid`.
      role: grid ? 'rowgroup' : 'group',
      'aria-labelledby': labelId
    }, elementProps]
  });
  const wrappedElement = /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxGroupContext.ComboboxGroupContext.Provider, {
    value: contextValue,
    children: element
  });
  if (items) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_GroupCollectionContext.GroupCollectionProvider, {
      items: items,
      children: wrappedElement
    });
  }
  return wrappedElement;
});
if (process.env.NODE_ENV !== "production") ComboboxGroup.displayName = "ComboboxGroup";