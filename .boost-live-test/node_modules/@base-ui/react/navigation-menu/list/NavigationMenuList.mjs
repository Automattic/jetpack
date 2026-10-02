'use client';

import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useDismiss, useHoverFloatingInteraction } from "../../floating-ui-react/index.mjs";
import { getTarget } from "../../floating-ui-react/utils.mjs";
import { CompositeRoot } from "../../internals/composite/root/CompositeRoot.mjs";
import { useNavigationMenuRootContext, useNavigationMenuTreeContext } from "../root/NavigationMenuRootContext.mjs";
import { NAVIGATION_MENU_TRIGGER_IDENTIFIER } from "../utils/constants.mjs";
import { NavigationMenuDismissContext } from "./NavigationMenuDismissContext.mjs";
import { getEmptyRootContext } from "../../floating-ui-react/utils/getEmptyRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Contains a list of navigation menu items.
 * Renders a `<ul>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const NavigationMenuList = /*#__PURE__*/React.forwardRef(function NavigationMenuList(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const nodeId = useNavigationMenuTreeContext();
  const {
    orientation,
    open,
    floatingRootContext,
    positionerElement,
    value,
    closeDelay,
    viewportElement,
    nested
  } = useNavigationMenuRootContext();
  const fallbackContext = React.useMemo(() => getEmptyRootContext(), []);
  const context = floatingRootContext || fallbackContext;
  const interactionsEnabled = positionerElement != null || value == null;
  const hoverInteractionsEnabled = positionerElement != null || viewportElement != null || value == null;
  useHoverFloatingInteraction(context, {
    enabled: Boolean(floatingRootContext) && hoverInteractionsEnabled,
    closeDelay,
    nodeId
  });
  const dismiss = useDismiss(context, {
    enabled: interactionsEnabled,
    outsidePressEvent: 'intentional',
    outsidePress(event) {
      const target = getTarget(event);
      const closestNavigationMenuTrigger = target?.closest(`[${NAVIGATION_MENU_TRIGGER_IDENTIFIER}]`);
      return closestNavigationMenuTrigger === null;
    }
  });
  const dismissProps = floatingRootContext ? dismiss : undefined;
  const state = {
    open
  };

  // `stopEventPropagation` won't stop the propagation if the end of the list is reached,
  // but we want to block it in this case.
  // When nested, skip this handler so arrow keys can reach the parent CompositeRoot.
  const defaultProps = nested ? EMPTY_OBJECT : {
    onKeyDown(event) {
      const shouldStop = orientation === 'horizontal' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') || orientation === 'vertical' && (event.key === 'ArrowUp' || event.key === 'ArrowDown');
      if (shouldStop) {
        event.stopPropagation();
      }
    }
  };
  const props = [dismissProps?.floating || EMPTY_OBJECT, defaultProps, elementProps];

  // When nested, skip the CompositeRoot wrapper so that triggers can participate
  // in the parent Content's composite navigation context. The key propagation
  // guard is already omitted through `defaultProps` above.
  const element = useRenderElement('ul', componentProps, {
    state,
    ref: forwardedRef,
    props,
    enabled: nested
  });
  if (nested) {
    return /*#__PURE__*/_jsx(NavigationMenuDismissContext.Provider, {
      value: dismissProps,
      children: element
    });
  }
  return /*#__PURE__*/_jsx(NavigationMenuDismissContext.Provider, {
    value: dismissProps,
    children: /*#__PURE__*/_jsx(CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef],
      props: props,
      loopFocus: false,
      orientation: orientation,
      tag: "ul"
    })
  });
});
if (process.env.NODE_ENV !== "production") NavigationMenuList.displayName = "NavigationMenuList";