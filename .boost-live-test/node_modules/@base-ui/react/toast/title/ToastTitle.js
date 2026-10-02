"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastTitle = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _useToastLabelPart = require("../utils/useToastLabelPart");
/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastTitle = exports.ToastTitle = /*#__PURE__*/React.forwardRef(function ToastTitle(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    children: childrenProp,
    ...elementProps
  } = componentProps;
  const {
    id,
    children,
    type,
    setId
  } = (0, _useToastLabelPart.useToastLabelPart)(idProp, childrenProp, 'title');
  const state = {
    type
  };
  const element = (0, _useRenderElement.useRenderElement)('h2', componentProps, {
    ref: forwardedRef,
    state,
    props: {
      ...elementProps,
      id,
      children
    }
  });
  return (0, _useToastLabelPart.useToastLabelElement)(element, id, setId);
});
if (process.env.NODE_ENV !== "production") ToastTitle.displayName = "ToastTitle";