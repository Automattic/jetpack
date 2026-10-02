"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectItemText = void 0;
var React = _interopRequireWildcard(require("react"));
var _SelectRootContext = require("../root/SelectRootContext");
var _SelectItemContext = require("../item/SelectItemContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectItemText = exports.SelectItemText = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef(function SelectItemText(componentProps, forwardedRef) {
  const {
    index,
    textRef,
    selectedByFocus
  } = (0, _SelectItemContext.useSelectItemContext)();
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const localRef = React.useCallback(node => {
    if (!node) {
      return;
    }
    if (index === 0) {
      store.context.firstItemTextRef.current = node;
    }
    if (selectedByFocus) {
      store.context.selectedItemTextRef.current = node;
    }
  }, [store, index, selectedByFocus]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [localRef, forwardedRef, textRef],
    props: elementProps
  });
  return element;
}));
if (process.env.NODE_ENV !== "production") SelectItemText.displayName = "SelectItemText";