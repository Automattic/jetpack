"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxLabel = void 0;
var React = _interopRequireWildcard(require("react"));
var _error = require("@base-ui/utils/error");
var _safeReact = require("@base-ui/utils/safeReact");
var _useRenderElement = require("../../internals/useRenderElement");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _constants = require("../../internals/field-constants/constants");
var _useLabel = require("../../internals/labelable-provider/useLabel");
var _resolveAriaLabelledBy = require("../../utils/resolveAriaLabelledBy");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
/**
 * An accessible label that is automatically associated with the combobox trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxLabel = exports.ComboboxLabel = /*#__PURE__*/React.forwardRef(function ComboboxLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  // Keep label id derived from the root and ignore runtime `id` overrides from untyped consumers.
  const elementPropsWithoutId = elementProps;
  delete elementPropsWithoutId.id;
  const fieldRootContext = (0, _FieldRootContext.useFieldRootContext)();
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const inputInsidePopup = store.useState('inputInsidePopup');
  const triggerElement = store.useState('triggerElement');
  const inputElement = store.useState('inputElement');
  const rootId = store.useState('id');
  const defaultLabelId = (0, _resolveAriaLabelledBy.getDefaultLabelId)(rootId);
  const localControlId = triggerElement?.id ?? (inputInsidePopup ? rootId : undefined);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!inputElement || inputInsidePopup) {
        return;
      }
      const ownerStackMessage = _safeReact.SafeReact.captureOwnerStack?.() || '';
      const message = '<Combobox.Label> labels <Combobox.Trigger> only. ' + 'When <Combobox.Input> is the form control, use a native <label> or <Field.Label> instead.';
      (0, _error.error)(`${message}${ownerStackMessage}`);
    }, [inputElement, inputInsidePopup]);
  }
  const labelProps = (0, _useLabel.useLabel)({
    id: defaultLabelId,
    fallbackControlId: localControlId,
    setLabelId(nextLabelId) {
      const resolvedLabelId = typeof nextLabelId === 'function' ? nextLabelId(store.state.labelId) : nextLabelId;
      store.set('labelId', resolvedLabelId);
    }
  });
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state: fieldRootContext.state,
    props: [labelProps, elementProps],
    stateAttributesMapping: _constants.fieldValidityMapping
  });
});
if (process.env.NODE_ENV !== "production") ComboboxLabel.displayName = "ComboboxLabel";