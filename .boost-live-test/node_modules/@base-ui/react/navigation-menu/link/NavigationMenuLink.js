"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuLink = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _isOutsideMenuEvent = require("../utils/isOutsideMenuEvent");
var _CompositeItem = require("../../internals/composite/item/CompositeItem");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuLink = exports.NavigationMenuLink = /*#__PURE__*/React.forwardRef(function NavigationMenuLink(componentProps, forwardedRef) {
  const {
    className,
    render,
    active = false,
    closeOnClick = false,
    style,
    ...elementProps
  } = componentProps;
  const {
    setValue,
    popupElement,
    positionerElement,
    rootRef
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const nodeId = (0, _NavigationMenuRootContext.useNavigationMenuTreeContext)();
  const tree = (0, _floatingUiReact.useFloatingTree)();
  const state = {
    active
  };
  const defaultProps = {
    'aria-current': active ? 'page' : undefined,
    tabIndex: undefined,
    onClick(event) {
      if (closeOnClick) {
        setValue(null, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.linkPress, event.nativeEvent));
      }
    },
    onBlur(event) {
      if (positionerElement && popupElement && (0, _isOutsideMenuEvent.isOutsideMenuEvent)({
        currentTarget: event.currentTarget,
        relatedTarget: event.relatedTarget
      }, {
        popupElement,
        rootRef,
        tree,
        nodeId
      })) {
        setValue(null, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event.nativeEvent));
      }
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
    tag: "a",
    render: render,
    className: className,
    style: style,
    state: state,
    refs: [forwardedRef],
    props: [defaultProps, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") NavigationMenuLink.displayName = "NavigationMenuLink";