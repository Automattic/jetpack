"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxTrigger = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _owner = require("@base-ui/utils/owner");
var _useRenderElement = require("../../internals/useRenderElement");
var _useButton = require("../../internals/use-button");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _utils = require("../../floating-ui-react/utils");
var _getPseudoElementBounds = require("../../utils/getPseudoElementBounds");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _floatingUiReact = require("../../floating-ui-react");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _resolveAriaLabelledBy = require("../../utils/resolveAriaLabelledBy");
var _utils2 = require("../root/utils");
var _parts = require("../utils/parts");
/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxTrigger = exports.ComboboxTrigger = /*#__PURE__*/React.forwardRef(function ComboboxTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    nativeButton = true,
    disabled: disabledProp = false,
    id: idProp,
    style,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState,
    disabled: fieldDisabled,
    setTouched,
    setFocused,
    validationMode,
    validation
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId: fieldLabelId
  } = (0, _LabelableContext.useLabelableContext)();
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const selectionMode = store.useState('selectionMode');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const required = store.useState('required');
  const positionerElement = store.useState('positionerElement');
  const listElement = store.useState('listElement');
  const storedPopupId = store.useState('popupId');
  const triggerProps = store.useState('triggerProps');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const rootId = store.useState('id');
  const comboboxLabelId = store.useState('labelId');
  const open = store.useState('open');
  const selectedValue = store.useState('selectedValue');
  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const hasSelectedValue = store.useState('hasSelectedValue');
  const floatingRootContext = (0, _ComboboxRootContext.useComboboxFloatingContext)();
  const inputValue = (0, _ComboboxRootContext.useComboboxInputValueContext)();
  const focusTimeout = (0, _useTimeout.useTimeout)();
  const disabled = fieldDisabled || comboboxDisabled || disabledProp;
  const listEmpty = (0, _parts.useListEmpty)();
  const popupSide = (0, _parts.usePopupSide)(store);
  (0, _useLabelableId.useLabelableId)({
    id: inputInsidePopup ? idProp : undefined
  });
  const id = inputInsidePopup ? idProp ?? rootId : idProp;
  const ariaLabelledBy = (0, _resolveAriaLabelledBy.resolveAriaLabelledBy)(fieldLabelId, comboboxLabelId);
  let ariaControls;
  if (open && inputInsidePopup) {
    // Fall back to the default id while the popup registers its own (custom ids are stored once the
    // popup mounts), so `aria-controls` is set on the same commit `open` becomes `true`.
    ariaControls = storedPopupId ?? (0, _utils2.getComboboxPopupId)(rootId);
  } else if (open) {
    ariaControls = listElement?.id;
  }
  const currentPointerTypeRef = React.useRef('');
  function trackPointerType(event) {
    currentPointerTypeRef.current = event.pointerType;
  }
  const {
    reference: triggerTypeaheadProps
  } = (0, _floatingUiReact.useTypeahead)(floatingRootContext, {
    // Typeahead on a closed trigger commits a value rather than moving a highlight, so it stays
    // gated on `readOnly`.
    enabled: !open && !readOnly && !comboboxDisabled && selectionMode === 'single',
    listRef: store.context.labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      const nextSelectedValue = store.context.valuesRef.current[index];
      if (nextSelectedValue !== undefined) {
        store.context.setSelectedValue(nextSelectedValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none));
      }
    }
  });
  const {
    reference: triggerClickProps
  } = (0, _floatingUiReact.useClick)(floatingRootContext, {
    enabled: !comboboxDisabled,
    event: 'mousedown'
  });
  const {
    buttonRef,
    getButtonProps
  } = (0, _useButton.useButton)({
    native: nativeButton,
    disabled
  });
  const state = {
    ...fieldState,
    readOnly,
    open,
    disabled,
    popupSide,
    listEmpty,
    placeholder: selectionMode === 'none' ? false : !hasSelectedValue
  };
  const setTriggerElement = (0, _useStableCallback.useStableCallback)(element => {
    store.set('triggerElement', element);
  });
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    ref: [forwardedRef, buttonRef, setTriggerElement],
    state,
    props: [triggerProps, triggerClickProps, triggerTypeaheadProps, {
      id,
      tabIndex: inputInsidePopup ? 0 : -1,
      role: inputInsidePopup ? 'combobox' : undefined,
      'aria-expanded': open,
      'aria-haspopup': inputInsidePopup ? 'dialog' : 'listbox',
      'aria-controls': ariaControls,
      'aria-required': inputInsidePopup ? required || undefined : undefined,
      // Only valid alongside the `combobox` role; without it the trigger is a plain button, and
      // the `Combobox.Input` outside the popup already carries `aria-readonly`.
      'aria-readonly': inputInsidePopup ? readOnly || undefined : undefined,
      'aria-labelledby': ariaLabelledBy,
      onPointerDown: trackPointerType,
      onPointerEnter: trackPointerType,
      onFocus() {
        setFocused(true);
        if (disabled) {
          return;
        }
        focusTimeout.start(0, store.context.forceMount);
      },
      onBlur(event) {
        // If focus is moving into the popup, don't count it as a blur.
        if ((0, _utils.contains)(positionerElement, event.relatedTarget)) {
          return;
        }
        setTouched(true);
        setFocused(false);
        if (validationMode === 'onBlur') {
          const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
          validation.commit(valueToValidate);
        }
      },
      onMouseDown(event) {
        if (disabled) {
          return;
        }
        if (!inputInsidePopup) {
          floatingRootContext.set('domReferenceElement', event.currentTarget);
        }

        // Ensure items are registered for initial selection highlight.
        store.context.forceMount();
        if (currentPointerTypeRef.current !== 'touch') {
          store.context.inputRef.current?.focus();
          if (!inputInsidePopup) {
            event.preventDefault();
          }
        }
        if (open) {
          return;
        }
        const doc = (0, _owner.ownerDocument)(event.currentTarget);
        function handleMouseUp(mouseEvent) {
          const currentTriggerElement = store.state.triggerElement;
          if (!currentTriggerElement) {
            return;
          }
          const mouseUpTarget = (0, _utils.getTarget)(mouseEvent);
          const positioner = store.state.positionerElement;
          const list = store.state.listElement;
          if ((0, _utils.contains)(currentTriggerElement, mouseUpTarget) || (0, _utils.contains)(positioner, mouseUpTarget) || (0, _utils.contains)(list, mouseUpTarget)) {
            return;
          }
          if ((0, _getPseudoElementBounds.isMouseWithinBounds)(mouseEvent, currentTriggerElement)) {
            return;
          }
          store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.cancelOpen, mouseEvent));
        }
        if (inputInsidePopup) {
          doc.addEventListener('mouseup', handleMouseUp, {
            once: true
          });
        }
      },
      onKeyDown(event) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          (0, _utils.stopEvent)(event);
          store.context.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.listNavigation, event.nativeEvent));
          store.context.inputRef.current?.focus();
        }
      }
    }, validation.getValidationProps(disabled, elementProps), getButtonProps],
    stateAttributesMapping: _stateAttributesMapping.triggerStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ComboboxTrigger.displayName = "ComboboxTrigger";