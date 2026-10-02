'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useId } from '@base-ui/utils/useId';
import { inertValue } from '@base-ui/utils/inertValue';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useNavigationMenuRootContext } from "../root/NavigationMenuRootContext.mjs";
import { FocusGuard } from "../../utils/FocusGuard.mjs";
import { getNextTabbable, getPreviousTabbable, isOutsideEvent, contains } from "../../floating-ui-react/utils.mjs";
import { getEmptyRootContext } from "../../floating-ui-react/utils/getEmptyRootContext.mjs";
import { useNavigationMenuPositionerContext } from "../positioner/NavigationMenuPositionerContext.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const EMPTY_ROOT_CONTEXT = getEmptyRootContext();
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
  } = useNavigationMenuRootContext();
  const hasPositioner = Boolean(useNavigationMenuPositionerContext(true));
  const referenceElement = positionerElement || viewportElement;
  if (!floatingRootContext && !hasPositioner) {
    return children;
  }
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx(FocusGuard, {
      ref: beforeInsideRef,
      onFocus: event => {
        if (referenceElement && isOutsideEvent(event, referenceElement)) {
          getNextTabbable(referenceElement)?.focus();
        } else {
          beforeOutsideRef.current?.focus();
        }
      }
    }), children, /*#__PURE__*/_jsx(FocusGuard, {
      ref: afterInsideRef,
      onFocus: event => {
        if (referenceElement && isOutsideEvent(event, referenceElement)) {
          getPreviousTabbable(referenceElement)?.focus();
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
export const NavigationMenuViewport = /*#__PURE__*/React.forwardRef(function NavigationMenuViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    id: idProp,
    ...elementProps
  } = componentProps;
  const id = useId(idProp);
  const {
    setViewportElement,
    setViewportTargetElement,
    floatingRootContext,
    prevTriggerElementRef,
    viewportInert,
    setViewportInert
  } = useNavigationMenuRootContext();
  const positioning = useNavigationMenuPositionerContext(true);
  const hasPositioner = Boolean(positioning);
  const domReference = (floatingRootContext || EMPTY_ROOT_CONTEXT).useState('domReferenceElement');
  useIsoLayoutEffect(() => {
    if (domReference) {
      prevTriggerElementRef.current = domReference;
    }
  }, [domReference, prevTriggerElementRef]);
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setViewportElement],
    props: [{
      id,
      onBlur(event) {
        const relatedTarget = event.relatedTarget;
        const currentTarget = event.currentTarget;

        // If focus is leaving the viewport and not going to the trigger, make it inert
        // to prevent a focus loop.
        if (relatedTarget && !contains(currentTarget, relatedTarget) && relatedTarget !== domReference) {
          setViewportInert(true);
        }
      },
      ...(!hasPositioner && viewportInert && {
        inert: inertValue(true)
      }),
      children: hasPositioner ? children : /*#__PURE__*/_jsx(Guards, {
        children: /*#__PURE__*/_jsx("div", {
          ref: setViewportTargetElement,
          children: children
        })
      })
    }, elementProps]
  });
  return hasPositioner ? /*#__PURE__*/_jsx(Guards, {
    children: element
  }) : element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuViewport.displayName = "NavigationMenuViewport";