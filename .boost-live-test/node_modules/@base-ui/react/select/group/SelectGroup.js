"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _SelectGroupContext = require("./SelectGroupContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectGroup = exports.SelectGroup = /*#__PURE__*/React.forwardRef(function SelectGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState();
  const contextValue = React.useMemo(() => ({
    labelId,
    setLabelId
  }), [labelId, setLabelId]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: [{
      role: 'group',
      'aria-labelledby': labelId
    }, elementProps]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_SelectGroupContext.SelectGroupContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") SelectGroup.displayName = "SelectGroup";