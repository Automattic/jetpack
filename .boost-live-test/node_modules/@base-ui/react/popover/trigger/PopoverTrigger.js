"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverTrigger = void 0;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
var _fastHooks = require("@base-ui/utils/fastHooks");
var _PopoverRootContext = require("../root/PopoverRootContext");
var _useButton = require("../../internals/use-button/useButton");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _constants = require("../../internals/constants");
var _floatingUiReact = require("../../floating-ui-react");
var _constants2 = require("../utils/constants");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _FocusGuard = require("../../utils/FocusGuard");
var _reasons = require("../../internals/reasons");
var _popups = require("../../utils/popups");
var _useTriggerFocusGuards = require("../../utils/popups/useTriggerFocusGuards");
var _useOpenInteractionType = require("../../utils/useOpenInteractionType");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverTrigger = exports.PopoverTrigger = (0, _fastHooks.fastComponentRef)(function PopoverTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled = false,
    nativeButton = true,
    handle,
    payload,
    openOnHover = false,
    delay = _constants2.OPEN_DELAY,
    closeDelay = 0,
    id: idProp,
    ...elementProps
  } = componentProps;
  const rootStore = (0, _PopoverRootContext.usePopoverRootContext)(true);
  const handleStore = (0, _popups.usePopupHandleStore)(handle);
  const store = handleStore ?? rootStore;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Popover.Trigger> must be either used within a <Popover.Root> component or provided with a handle.' : (0, _formatErrorMessage2.default)(74));
  }
  const thisTriggerId = (0, _useBaseUiId.useBaseUiId)(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const floatingContext = store.useState('floatingRootContext');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const popupId = store.useState('triggerPopupId', thisTriggerId);
  const triggerElementRef = React.useRef(null);
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = (0, _popups.useTriggerDataForwarding)(thisTriggerId, triggerElementRef, store, {
    payload,
    disabled,
    openOnHover,
    closeDelay
  });
  const openReason = store.useState('openChangeReason');
  const stickIfOpen = store.useState('stickIfOpen');
  const openMethod = store.useState('openMethod');
  const focusManagerModal = store.useState('focusManagerModal');
  const hoverProps = (0, _floatingUiReact.useHoverReferenceInteraction)(floatingContext, {
    enabled: !disabled && openOnHover && (openMethod !== 'touch' || openReason !== _reasons.REASONS.triggerPress),
    mouseOnly: true,
    move: false,
    handleClose: (0, _floatingUiReact.safePolygon)(),
    restMs: delay,
    delay: {
      close: closeDelay
    },
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
    isClosing: () => store.select('transitionStatus') === 'ending'
  });
  const click = (0, _floatingUiReact.useClick)(floatingContext, {
    stickIfOpen
  });
  const interactionTypeProps = (0, _useOpenInteractionType.useOpenMethodTriggerProps)(() => store.select('open'), interactionType => {
    store.set('openMethod', interactionType);
  });
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const stateAttributesMapping = {
    open(value) {
      if (value && openReason === _reasons.REASONS.triggerPress) {
        return _popupStateMapping.pressableTriggerOpenStateMapping.open(value);
      }
      return _popupStateMapping.triggerOpenStateMapping.open(value);
    }
  };
  const {
    preFocusGuardRef,
    handlePreFocusGuardFocus,
    handleFocusTargetFocus
  } = (0, _useTriggerFocusGuards.useTriggerFocusGuards)(store, triggerElementRef);
  const state = {
    disabled,
    open: isOpenedByThisTrigger
  };
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger, triggerElementRef],
    props: [click.reference, hoverProps, rootTriggerProps, interactionTypeProps, {
      [_constants.CLICK_TRIGGER_IDENTIFIER]: '',
      id: thisTriggerId,
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpenedByThisTrigger,
      'aria-controls': popupId
    }, elementProps, getButtonProps],
    stateAttributesMapping
  });

  // A fragment with key is required to ensure that the `element` is mounted to the same DOM node
  // regardless of whether the focus guards are rendered or not.
  const keyedElement = /*#__PURE__*/(0, _jsxRuntime.jsx)(React.Fragment, {
    children: element
  }, thisTriggerId);
  if (isMountedByThisTrigger && !focusManagerModal) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
        ref: preFocusGuardRef,
        onFocus: handlePreFocusGuardFocus
      }), keyedElement, /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
        ref: store.context.triggerFocusTargetRef,
        onFocus: handleFocusTargetFocus
      })]
    });
  }
  return keyedElement;
});
if (process.env.NODE_ENV !== "production") PopoverTrigger.displayName = "PopoverTrigger";