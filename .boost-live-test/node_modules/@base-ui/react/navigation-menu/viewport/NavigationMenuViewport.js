"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useId = require("@base-ui/utils/useId");
var _inertValue = require("@base-ui/utils/inertValue");
var _useRenderElement = require("../../internals/useRenderElement");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _FocusGuard = require("../../utils/FocusGuard");
var _utils = require("../../floating-ui-react/utils");
var _getEmptyRootContext = require("../../floating-ui-react/utils/getEmptyRootContext");
var _NavigationMenuPositionerContext = require("../positioner/NavigationMenuPositionerContext");
var _jsxRuntime = require("react/jsx-runtime");
const EMPTY_ROOT_CONTEXT = (0, _getEmptyRootContext.getEmptyRootContext)();
function Guards({
  children
}) {
  const {
    beforeInsideRef,
    beforeOutsideRef,
    afterInsideRef,
    afterOutsideRef,
    positionerElement,
    viewportElement,
    floatingRootContext
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const hasPositioner = Boolean((0, _NavigationMenuPositionerContext.useNavigationMenuPositionerContext)(true));
  const referenceElement = positionerElement || viewportElement;
  if (!floatingRootContext && !hasPositioner) {
    return children;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
      ref: beforeInsideRef,
      onFocus: event => {
        if (referenceElement && (0, _utils.isOutsideEvent)(event, referenceElement)) {
          (0, _utils.getNextTabbable)(referenceElement)?.focus();
        } else {
          beforeOutsideRef.current?.focus();
        }
      }
    }), children, /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
      ref: afterInsideRef,
      onFocus: event => {
        if (referenceElement && (0, _utils.isOutsideEvent)(event, referenceElement)) {
          (0, _utils.getPreviousTabbable)(referenceElement)?.focus();
        } else {
          afterOutsideRef.current?.focus();
        }
      }
    })]
  });
}

/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuViewport = exports.NavigationMenuViewport = /*#__PURE__*/React.forwardRef(function NavigationMenuViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    id: idProp,
    ...elementProps
  } = componentProps;
  const id = (0, _useId.useId)(idProp);
  const {
    setViewportElement,
    setViewportTargetElement,
    floatingRootContext,
    prevTriggerElementRef,
    viewportInert,
    setViewportInert
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const positioning = (0, _NavigationMenuPositionerContext.useNavigationMenuPositionerContext)(true);
  const hasPositioner = Boolean(positioning);
  const domReference = (floatingRootContext || EMPTY_ROOT_CONTEXT).useState('domReferenceElement');
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (domReference) {
      prevTriggerElementRef.current = domReference;
    }
  }, [domReference, prevTriggerElementRef]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, setViewportElement],
    props: [{
      id,
      onBlur(event) {
        const relatedTarget = event.relatedTarget;
        const currentTarget = event.currentTarget;

        // If focus is leaving the viewport and not going to the trigger, make it inert
        // to prevent a focus loop.
        if (relatedTarget && !(0, _utils.contains)(currentTarget, relatedTarget) && relatedTarget !== domReference) {
          setViewportInert(true);
        }
      },
      ...(!hasPositioner && viewportInert && {
        inert: (0, _inertValue.inertValue)(true)
      }),
      children: hasPositioner ? children : /*#__PURE__*/(0, _jsxRuntime.jsx)(Guards, {
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          ref: setViewportTargetElement,
          children: children
        })
      })
    }, elementProps]
  });
  return hasPositioner ? /*#__PURE__*/(0, _jsxRuntime.jsx)(Guards, {
    children: element
  }) : element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuViewport.displayName = "NavigationMenuViewport";