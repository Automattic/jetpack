"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _MenuRootContext = require("../root/MenuRootContext");
var _MenuPositionerContext = require("../positioner/MenuPositionerContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _ToolbarRootContext = require("../../toolbar/root/ToolbarRootContext");
var _composite = require("../../internals/composite/composite");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuPopup = exports.MenuPopup = /*#__PURE__*/React.forwardRef(function MenuPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    finalFocus,
    ...elementProps
  } = componentProps;
  const {
    store
  } = (0, _MenuRootContext.useMenuRootContext)();
  const {
    side,
    align
  } = (0, _MenuPositionerContext.useMenuPositionerContext)();
  const insideToolbar = (0, _ToolbarRootContext.useToolbarRootContext)(true) != null;
  const open = store.useState('open');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const mounted = store.useState('mounted');
  const instantType = store.useState('instantType');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const parent = store.useState('parent');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const rootId = store.useState('rootId');
  const floatingContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const closeDelay = store.useState('closeDelay');
  const hoverEnabled = store.useState('hoverEnabled');
  const disabled = store.useState('disabled');
  const openMethod = store.useState('openMethod');
  const isContextMenu = parent.type === 'context-menu';
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    }
  });
  React.useEffect(() => {
    function handleClose(event) {
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(event.reason, event.domEvent));
    }
    floatingTreeRoot.events.on('close', handleClose);
    return () => {
      floatingTreeRoot.events.off('close', handleClose);
    };
  }, [floatingTreeRoot.events, store]);
  (0, _floatingUiReact.useHoverFloatingInteraction)(floatingContext, {
    enabled: hoverEnabled && !disabled && !isContextMenu && parent.type !== 'menubar',
    closeDelay
  });
  const setPopupElement = store.useStateSetter('popupElement');
  const state = {
    transitionStatus,
    side,
    align,
    open,
    nested: parent.type === 'menu',
    instant: instantType
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping,
    props: [popupProps, {
      onKeyDown(event) {
        if (insideToolbar && _composite.COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }
      }
    }, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps, {
      'data-rootownerid': rootId
    }]
  });
  let returnFocus = parent.type === undefined || isContextMenu;
  if (activeTriggerElement || parent.type === 'menubar' && lastOpenChangeReason !== _reasons.REASONS.outsidePress) {
    returnFocus = true;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
    context: floatingContext,
    openInteractionType: openMethod,
    modal: isContextMenu,
    disabled: !mounted,
    returnFocus: finalFocus === undefined ? returnFocus : finalFocus,
    initialFocus: parent.type !== 'menu',
    restoreFocus: true,
    externalTree: parent.type !== 'menubar' ? floatingTreeRoot : undefined,
    previousFocusableElement: activeTriggerElement,
    nextFocusableElement: parent.type === undefined ? store.context.triggerFocusTargetRef : undefined,
    beforeContentFocusGuardRef: parent.type === undefined ? store.context.beforeContentFocusGuardRef : undefined,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MenuPopup.displayName = "MenuPopup";