"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxGroupLabel = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _ComboboxGroupContext = require("../group/ComboboxGroupContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxGroupLabel = exports.ComboboxGroupLabel = /*#__PURE__*/React.forwardRef(function ComboboxGroupLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    setLabelId
  } = (0, _ComboboxGroupContext.useComboboxGroupContext)();
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setLabelId(id);
    return () => {
      setLabelId(currentId => currentId === id ? undefined : currentId);
    };
  }, [id, setLabelId]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: [{
      id,
      'aria-hidden': true
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ComboboxGroupLabel.displayName = "ComboboxGroupLabel";