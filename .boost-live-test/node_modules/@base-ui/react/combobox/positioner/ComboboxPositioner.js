"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxPositioner = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _inertValue = require("@base-ui/utils/inertValue");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _ComboboxPositionerContext = require("./ComboboxPositionerContext");
var _parts = require("../utils/parts");
var _useAnchorPositioning = require("../../internals/useAnchorPositioning");
var _ComboboxPortalContext = require("../portal/ComboboxPortalContext");
var _constants = require("../../internals/constants");
var _InternalBackdrop = require("../../utils/InternalBackdrop");
var _usePositioner = require("../../utils/usePositioner");
var _useAnchoredPopupScrollLock = require("../../utils/useAnchoredPopupScrollLock");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxPositioner = exports.ComboboxPositioner = /*#__PURE__*/React.forwardRef(function ComboboxPositioner(componentProps, forwardedRef) {
  const {
    render,
    className,
    anchor,
    // `useAnchorPositioning` applies the same defaults to the undefined values; the names
    // remain destructured to exclude the props from `elementProps`.
    positionMethod,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding,
    sticky,
    disableAnchorTracking = false,
    collisionAvoidance = _constants.DROPDOWN_COLLISION_AVOIDANCE,
    style: styleProp,
    ...elementProps
  } = componentProps;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const floatingRootContext = (0, _ComboboxRootContext.useComboboxFloatingContext)();
  const keepMounted = (0, _ComboboxPortalContext.useComboboxPortalContext)();
  const modal = store.useState('modal');
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const triggerElement = store.useState('triggerElement');
  const inputElement = store.useState('inputElement');
  const inputGroupElement = store.useState('inputGroupElement');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const transitionStatus = store.useState('transitionStatus');
  const empty = (0, _parts.useListEmpty)();
  const resolvedAnchor = anchor ?? (inputInsidePopup ? triggerElement : inputGroupElement ?? inputElement);
  const positioning = (0, _useAnchorPositioning.useAnchorPositioning)({
    anchor: resolvedAnchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    disableAnchorTracking,
    keepMounted,
    collisionAvoidance,
    lazyFlip: true
  });
  (0, _useAnchoredPopupScrollLock.useAnchoredPopupScrollLock)(open && modal, openMethod === 'touch', positionerElement, triggerElement);
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    empty
  };
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    store.set('popupSide', positioning.side);
  }, [store, positioning.side]);
  const setPositionerElement = (0, _useStableCallback.useStableCallback)(element => {
    store.set('positionerElement', element);
  });
  const element = (0, _usePositioner.usePositioner)(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_ComboboxPositionerContext.ComboboxPositionerContext.Provider, {
    value: positioning,
    children: [mounted && modal && /*#__PURE__*/(0, _jsxRuntime.jsx)(_InternalBackdrop.InternalBackdrop, {
      inert: (0, _inertValue.inertValue)(!open),
      cutout: inputGroupElement ?? inputElement ?? triggerElement
    }), element]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxPositioner.displayName = "ComboboxPositioner";