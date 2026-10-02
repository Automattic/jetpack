"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogTrigger = void 0;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
var _fastHooks = require("@base-ui/utils/fastHooks");
var _DialogRootContext = require("../root/DialogRootContext");
var _useButton = require("../../internals/use-button/useButton");
var _useRenderElement = require("../../internals/useRenderElement");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _constants = require("../../internals/constants");
var _popups = require("../../utils/popups");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _floatingUiReact = require("../../floating-ui-react");
var _useOpenInteractionType = require("../../utils/useOpenInteractionType");
/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogTrigger = exports.DialogTrigger = (0, _fastHooks.fastComponentRef)(function DialogTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled = false,
    nativeButton = true,
    id: idProp,
    payload,
    handle,
    ...elementProps
  } = componentProps;
  const dialogRootStore = (0, _DialogRootContext.useDialogRootContext)(true);
  const handleStore = (0, _popups.usePopupHandleStore)(handle);
  const store = handleStore ?? dialogRootStore;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Dialog.Trigger> must be used within <Dialog.Root> or provided with a handle.' : (0, _formatErrorMessage2.default)(79));
  }
  const thisTriggerId = (0, _useBaseUiId.useBaseUiId)(idProp);
  const floatingContext = store.useState('floatingRootContext');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const popupId = store.useState('triggerPopupId', thisTriggerId);
  const triggerElementRef = React.useRef(null);
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = (0, _popups.useTriggerDataForwarding)(thisTriggerId, triggerElementRef, store, {
    payload
  });
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    native: nativeButton
  });
  const click = (0, _floatingUiReact.useClick)(floatingContext);
  const interactionTypeProps = (0, _useOpenInteractionType.useOpenMethodTriggerProps)(() => store.select('open'), interactionType => {
    store.set('openMethod', interactionType);
  });
  const state = {
    disabled,
    open: isOpenedByThisTrigger
  };
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  return (0, _useRenderElement.useRenderElement)('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger, triggerElementRef],
    props: [click.reference, rootTriggerProps, interactionTypeProps, {
      [_constants.CLICK_TRIGGER_IDENTIFIER]: '',
      id: thisTriggerId,
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpenedByThisTrigger,
      'aria-controls': popupId
    }, elementProps, getButtonProps],
    stateAttributesMapping: _popupStateMapping.triggerOpenStateMapping
  });
});
if (process.env.NODE_ENV !== "production") DialogTrigger.displayName = "DialogTrigger";