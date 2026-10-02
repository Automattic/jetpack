"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectTrigger = void 0;
var React = _interopRequireWildcard(require("react"));
var _owner = require("@base-ui/utils/owner");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _SelectRootContext = require("../root/SelectRootContext");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _LabelableContext = require("../../internals/labelable-provider/LabelableContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _constants = require("../../internals/field-constants/constants");
var _useRenderElement = require("../../internals/useRenderElement");
var _getPseudoElementBounds = require("../../utils/getPseudoElementBounds");
var _utils = require("../../floating-ui-react/utils");
var _mergeProps = require("../../merge-props");
var _useButton = require("../../internals/use-button");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _resolveAriaLabelledBy = require("../../utils/resolveAriaLabelledBy");
var SelectTriggerDataAttributes = _interopRequireWildcard(require("./SelectTriggerDataAttributes"));
const SELECTED_DELAY = 400;
const stateAttributesMapping = {
  ..._popupStateMapping.pressableTriggerOpenStateMapping,
  ..._constants.fieldValidityMapping,
  popupSide: side => side ? {
    [SelectTriggerDataAttributes.popupSide]: side
  } : null,
  value: () => null
};

/**
 * A button that opens the select popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectTrigger = exports.SelectTrigger = /*#__PURE__*/React.forwardRef(function SelectTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    disabled: disabledProp = false,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    setTouched,
    setFocused,
    validationMode,
    validation,
    state: fieldState,
    disabled: fieldDisabled
  } = (0, _FieldRootContext.useFieldRootContext)();
  const {
    labelId: fieldLabelId
  } = (0, _LabelableContext.useLabelableContext)();
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const {
    readOnly,
    required,
    disabled: selectDisabled
  } = (0, _SelectRootContext.useSelectRootPropsContext)();
  const disabled = fieldDisabled || selectDisabled || disabledProp;
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const value = store.useState('value');
  const triggerProps = store.useState('triggerProps');
  const positionerElement = store.useState('positionerElement');
  const listElement = store.useState('listElement');
  const popupSideValue = store.useState('popupSide');
  const rootId = store.useState('id');
  const selectLabelId = store.useState('labelId');
  const hasSelectedValue = store.useState('hasSelectedValue');
  const popupSide = mounted && positionerElement ? popupSideValue : null;
  const id = idProp ?? rootId;
  const ariaLabelledBy = (0, _resolveAriaLabelledBy.resolveAriaLabelledBy)(fieldLabelId, selectLabelId);
  (0, _useLabelableId.useLabelableId)({
    id: idProp
  });
  const positionerRef = (0, _useValueAsRef.useValueAsRef)(positionerElement);
  const triggerRef = React.useRef(null);
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const setTriggerElement = store.useStateSetter('triggerElement');
  const timeoutFocus = (0, _useTimeout.useTimeout)();
  const timeoutMouseDown = (0, _useTimeout.useTimeout)();
  const selectedDelayTimeout = (0, _useTimeout.useTimeout)();
  React.useEffect(() => {
    if (open) {
      // A mousedown on the trigger can open the popup under the cursor. Keep mouseup selection
      // disabled briefly so releasing over either the selected item or a neighboring item doesn't
      // commit an accidental selection. SelectItem can still opt into unselected mouseup sooner
      // after a real drag over the item.
      selectedDelayTimeout.start(SELECTED_DELAY, () => {
        store.context.selectionRef.current.allowUnselectedMouseUp = true;
        store.context.selectionRef.current.allowSelectedMouseUp = true;
      });
      return () => {
        selectedDelayTimeout.clear();
      };
    }
    store.context.selectionRef.current = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      dragY: 0
    };
    timeoutMouseDown.clear();
    return undefined;
  }, [open, store, timeoutMouseDown, selectedDelayTimeout]);
  const mergedProps = (0, _mergeProps.mergeProps)(triggerProps, {
    id,
    role: 'combobox',
    'aria-expanded': open,
    'aria-haspopup': 'listbox',
    'aria-controls': open ? listElement?.id ?? (0, _utils.getFloatingFocusElement)(positionerElement)?.id : undefined,
    'aria-labelledby': ariaLabelledBy,
    'aria-readonly': readOnly || undefined,
    'aria-required': required || undefined,
    tabIndex: disabled ? -1 : 0,
    onFocus(event) {
      setFocused(true);

      // The popup element shouldn't obscure the focused trigger.
      if (open && store.context.alignItemWithTriggerActiveRef.current) {
        store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none, event.nativeEvent));
      }

      // Saves a re-render on initial click: `forceMount === true` mounts
      // the items before `open === true`. We could sync those cycles better
      // without a timeout, but this is enough for now.
      timeoutFocus.start(0, () => {
        store.set('forceMount', true);
      });
    },
    onBlur(event) {
      // If focus is moving into the popup, don't count it as a blur.
      if ((0, _utils.contains)(positionerElement, event.relatedTarget)) {
        return;
      }
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit(value);
      }
    },
    onMouseDown(event) {
      if (open) {
        return;
      }
      const doc = (0, _owner.ownerDocument)(event.currentTarget);
      function handleMouseUp(mouseEvent) {
        if (!triggerRef.current) {
          return;
        }
        const mouseUpTarget = mouseEvent.target;

        // Don't treat the release as an outside press when it lands on the trigger or inside
        // the popup positioner (or their children).
        if ((0, _utils.contains)(triggerRef.current, mouseUpTarget) || (0, _utils.contains)(positionerRef.current, mouseUpTarget)) {
          return;
        }
        if ((0, _getPseudoElementBounds.isMouseWithinBounds)(mouseEvent, triggerRef.current)) {
          return;
        }
        store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.cancelOpen, mouseEvent));
      }

      // Firefox can fire this upon mousedown
      timeoutMouseDown.start(0, () => {
        doc.addEventListener('mouseup', handleMouseUp, {
          once: true
        });
      });
    }
  }, elementProps, getButtonProps);
  const props = validation.getValidationProps(disabled, mergedProps);

  // ensure nested useButton does not overwrite the combobox role:
  // <Toolbar.Button render={<Select.Trigger />} />
  props.role = 'combobox';
  const state = {
    ...fieldState,
    open,
    disabled,
    value,
    readOnly,
    popupSide,
    placeholder: !hasSelectedValue
  };
  return (0, _useRenderElement.useRenderElement)('button', componentProps, {
    ref: [forwardedRef, triggerRef, buttonRef, setTriggerElement],
    state,
    stateAttributesMapping,
    props
  });
});
if (process.env.NODE_ENV !== "production") SelectTrigger.displayName = "SelectTrigger";