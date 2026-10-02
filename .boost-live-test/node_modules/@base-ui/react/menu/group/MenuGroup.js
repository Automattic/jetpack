"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _MenuGroupContext = require("./MenuGroupContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuGroup = exports.MenuGroup = /*#__PURE__*/React.forwardRef(function MenuGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState(undefined);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: {
      role: 'group',
      'aria-labelledby': labelId,
      ...elementProps
    }
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenuGroupContext.MenuGroupContext.Provider, {
    value: setLabelId,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MenuGroup.displayName = "MenuGroup";