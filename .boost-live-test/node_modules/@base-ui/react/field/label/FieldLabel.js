"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldLabel = void 0;
var React = _interopRequireWildcard(require("react"));
var _error = require("@base-ui/utils/error");
var _safeReact = require("@base-ui/utils/safeReact");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _constants = require("../../internals/field-constants/constants");
var _useRenderElement = require("../../internals/useRenderElement");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _useLabel = require("../../internals/labelable-provider/useLabel");
var _FieldItemContext = require("../item/FieldItemContext");
/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldLabel = exports.FieldLabel = /*#__PURE__*/React.forwardRef(function FieldLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    nativeLabel = true,
    ...elementProps
  } = componentProps;
  const fieldRootContext = (0, _FieldRootContext.useFieldRootContext)(false);
  const fieldItemContext = (0, _FieldItemContext.useFieldItemContext)();
  const {
    labelId
  } = (0, _LabelableContext.useLabelableContext)();
  const state = {
    ...fieldRootContext.state,
    disabled: fieldRootContext.disabled || fieldItemContext.disabled
  };
  const labelRef = React.useRef(null);
  const labelProps = (0, _useLabel.useLabel)({
    id: labelId ?? idProp,
    native: nativeLabel
  });
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!labelRef.current) {
        return;
      }
      const isLabelTag = labelRef.current.tagName === 'LABEL';
      if (nativeLabel) {
        if (!isLabelTag) {
          const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
          const message = '<Field.Label> expected a <label> element because the `nativeLabel` prop is true. ' + 'Rendering a non-<label> disables native label association, so `htmlFor` will not ' + 'work. Use a real <label> in the `render` prop, or set `nativeLabel` to `false`.';
          (0, _error.error)(`${message}${ownerStackMessage}`);
        }
      } else if (isLabelTag) {
        const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
        const message = '<Field.Label> expected a non-<label> element because the `nativeLabel` prop is false. ' + 'Rendering a <label> assumes native label behavior while Base UI treats it as ' + 'non-native, which can cause unexpected pointer behavior. Use a non-<label> in the ' + '`render` prop, or set `nativeLabel` to `true`.';
        (0, _error.error)(`${message}${ownerStackMessage}`);
      }
    }, [nativeLabel]);
  }
  const element = (0, _useRenderElement.useRenderElement)('label', componentProps, {
    ref: [forwardedRef, labelRef],
    state,
    props: [labelProps, elementProps],
    stateAttributesMapping: _constants.fieldValidityMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") FieldLabel.displayName = "FieldLabel";