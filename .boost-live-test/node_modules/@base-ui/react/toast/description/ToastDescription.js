"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastDescription = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _useToastLabelPart = require("../utils/useToastLabelPart");
/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastDescription = exports.ToastDescription = /*#__PURE__*/React.forwardRef(function ToastDescription(componentProps, forwardedRef) {
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
  } = (0, _useToastLabelPart.useToastLabelPart)(idProp, childrenProp, 'description');
  const state = {
    type
  };
  const element = (0, _useRenderElement.useRenderElement)('p', componentProps, {
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
if (process.env.NODE_ENV !== "production") ToastDescription.displayName = "ToastDescription";