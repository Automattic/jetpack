"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxInputGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useRenderElement = require("../../internals/useRenderElement");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _handleInputPress = require("../utils/handleInputPress");
var _parts = require("../utils/parts");
var _element = require("../../floating-ui-react/utils/element");
/**
 * A wrapper for the input and its associated controls.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxInputGroup = exports.ComboboxInputGroup = /*#__PURE__*/React.forwardRef(function ComboboxInputGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState
  } = (0, _FieldRootContext.useFieldRootContext)();
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const open = store.useState('open');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const hasSelectedValue = store.useState('hasSelectedValue');
  const selectionMode = store.useState('selectionMode');
  const popupSide = (0, _parts.usePopupSide)(store);
  const disabled = comboboxDisabled;
  const listEmpty = (0, _parts.useListEmpty)();
  const placeholder = selectionMode === 'none' ? false : !hasSelectedValue;
  const state = {
    ...fieldState,
    open,
    disabled,
    readOnly,
    popupSide,
    listEmpty,
    placeholder
  };
  const setInputGroupElement = (0, _useStableCallback.useStableCallback)(element => {
    store.set('inputGroupElement', element);
  });
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, setInputGroupElement],
    props: [{
      role: 'group',
      onMouseDown(event) {
        (0, _handleInputPress.handleInputPress)(event, store, disabled, target => {
          return (0, _element.contains)(store.context.chipsContainerRef.current, target);
        });
      }
    }, elementProps],
    state,
    stateAttributesMapping: _stateAttributesMapping.triggerStateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") ComboboxInputGroup.displayName = "ComboboxInputGroup";