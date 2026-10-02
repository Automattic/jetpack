"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardTrigger = void 0;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
var _fastHooks = require("@base-ui/utils/fastHooks");
var _PreviewCardContext = require("../root/PreviewCardContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _popups = require("../../utils/popups");
var _constants = require("../utils/constants");
var _floatingUiReact = require("../../floating-ui-react");
/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardTrigger = exports.PreviewCardTrigger = (0, _fastHooks.fastComponentRef)(function PreviewCardTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    delay,
    closeDelay,
    id: idProp,
    payload,
    handle,
    style,
    ...elementProps
  } = componentProps;
  const rootContext = (0, _PreviewCardContext.usePreviewCardRootContext)(true);
  const handleStore = (0, _popups.usePopupHandleStore)(handle);
  const store = handleStore ?? rootContext;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <PreviewCard.Trigger> must be either used within a <PreviewCard.Root> component or provided with a handle.' : (0, _formatErrorMessage2.default)(89));
  }
  const thisTriggerId = (0, _useBaseUiId.useBaseUiId)(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');
  const inlineRectCoordsRef = store.context.inlineRectCoordsRef;
  const triggerElementRef = React.useRef(null);
  const delayWithDefault = delay ?? _constants.OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? _constants.CLOSE_DELAY;
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = (0, _popups.useTriggerDataForwarding)(thisTriggerId, triggerElementRef, store, {
    payload,
    closeDelay: closeDelayWithDefault
  });
  const hoverProps = (0, _floatingUiReact.useHoverReferenceInteraction)(floatingRootContext, {
    mouseOnly: true,
    move: false,
    handleClose: (0, _floatingUiReact.safePolygon)(),
    delay: () => ({
      open: delayWithDefault,
      close: closeDelayWithDefault
    }),
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
    isClosing: () => store.select('transitionStatus') === 'ending'
  });
  const focusProps = (0, _floatingUiReact.useFocus)(floatingRootContext, {
    delay: delayWithDefault
  });
  const state = {
    open: isOpenedByThisTrigger
  };
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  const inlineRectTriggerProps = (0, _popups.getInlineRectTriggerProps)(inlineRectCoordsRef, isOpenedByThisTrigger);
  const element = (0, _useRenderElement.useRenderElement)('a', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    props: [hoverProps, focusProps.reference, rootTriggerProps, inlineRectTriggerProps, {
      id: thisTriggerId
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PreviewCardTrigger.displayName = "PreviewCardTrigger";