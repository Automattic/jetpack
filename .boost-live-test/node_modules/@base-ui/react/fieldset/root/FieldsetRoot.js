"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldsetRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _FieldsetRootContext = require("./FieldsetRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups a shared legend with related controls.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
const FieldsetRoot = exports.FieldsetRoot = /*#__PURE__*/React.forwardRef(function FieldsetRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;
  const [legendId, setLegendId] = React.useState(undefined);
  const parentDisabled = (0, _FieldsetRootContext.useFieldsetRootContext)(true)?.disabled;
  const disabled = parentDisabled || disabledProp;
  const state = {
    disabled
  };
  const element = (0, _useRenderElement.useRenderElement)('fieldset', componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      'aria-labelledby': legendId,
      disabled
    }, elementProps]
  });
  const contextValue = React.useMemo(() => ({
    legendId,
    setLegendId,
    disabled
  }), [legendId, setLegendId, disabled]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_FieldsetRootContext.FieldsetRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") FieldsetRoot.displayName = "FieldsetRoot";