'use client';

import * as React from 'react';
import { useFloatingTree } from "../../floating-ui-react/index.mjs";
import { useNavigationMenuRootContext, useNavigationMenuTreeContext } from "../root/NavigationMenuRootContext.mjs";
import { isOutsideMenuEvent } from "../utils/isOutsideMenuEvent.mjs";
import { CompositeItem } from "../../internals/composite/item/CompositeItem.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";

/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const NavigationMenuLink = /*#__PURE__*/React.forwardRef(function NavigationMenuLink(componentProps, forwardedRef) {
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
  } = useNavigationMenuRootContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();
  const state = {
    active
  };
  const defaultProps = {
    'aria-current': active ? 'page' : undefined,
    tabIndex: undefined,
    onClick(event) {
      if (closeOnClick) {
        setValue(null, createChangeEventDetails(REASONS.linkPress, event.nativeEvent));
      }
    },
    onBlur(event) {
      if (positionerElement && popupElement && isOutsideMenuEvent({
        currentTarget: event.currentTarget,
        relatedTarget: event.relatedTarget
      }, {
        popupElement,
        rootRef,
        tree,
        nodeId
      })) {
        setValue(null, createChangeEventDetails(REASONS.focusOut, event.nativeEvent));
      }
    }
  };
  return /*#__PURE__*/_jsx(CompositeItem, {
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