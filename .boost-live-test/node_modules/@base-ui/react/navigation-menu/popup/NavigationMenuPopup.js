"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _NavigationMenuPositionerContext = require("../positioner/NavigationMenuPositionerContext");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuPopup = exports.NavigationMenuPopup = /*#__PURE__*/React.forwardRef(function NavigationMenuPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    open,
    transitionStatus,
    setPopupElement
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const positioning = (0, _NavigationMenuPositionerContext.useNavigationMenuPositionerContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const state = {
    open,
    transitionStatus,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden
  };

  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  let isPhysicalLeft = positioning.side === 'left';
  if (direction === 'rtl') {
    isPhysicalLeft = isPhysicalLeft || positioning.side === 'inline-end';
  } else {
    isPhysicalLeft = isPhysicalLeft || positioning.side === 'inline-start';
  }
  const isOriginSide = positioning.side === 'top' || isPhysicalLeft;
  const element = (0, _useRenderElement.useRenderElement)('nav', componentProps, {
    state,
    ref: [forwardedRef, setPopupElement],
    props: [{
      id,
      tabIndex: -1,
      style: isOriginSide ? {
        position: 'absolute',
        [positioning.side === 'top' ? 'bottom' : 'top']: '0',
        [isPhysicalLeft ? 'right' : 'left']: '0'
      } : {}
    }, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps],
    stateAttributesMapping: _popupStateMapping.popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuPopup.displayName = "NavigationMenuPopup";