'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { resolveStyle } from "../../utils/resolveStyle.mjs";
import { useCollapsibleRootContext } from "../../collapsible/root/CollapsibleRootContext.mjs";
import { useCollapsiblePanel } from "../../collapsible/panel/useCollapsiblePanel.mjs";
import { useAccordionRootContext } from "../root/AccordionRootContext.mjs";
import { useAccordionItemContext } from "../item/AccordionItemContext.mjs";
import { accordionStateAttributesMapping } from "../item/stateAttributesMapping.mjs";
import * as AccordionPanelCssVars from "./AccordionPanelCssVars.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export const AccordionPanel = /*#__PURE__*/React.forwardRef(function AccordionPanel(componentProps, forwardedRef) {
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    id: idProp,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    hiddenUntilFound: contextHiddenUntilFound,
    keepMounted: contextKeepMounted
  } = useAccordionRootContext();
  const {
    defaultPanelId,
    mounted,
    onOpenChange,
    open,
    setMounted,
    setOpen,
    setPanelIdState,
    transitionStatus
  } = useCollapsibleRootContext();
  const hiddenUntilFound = hiddenUntilFoundProp ?? contextHiddenUntilFound;
  const keepMounted = keepMountedProp ?? contextKeepMounted;
  const registeredId = idProp || undefined;
  const id = idProp ?? defaultPanelId;

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (keepMountedProp === false && hiddenUntilFound) {
        warn('The `keepMounted={false}` prop on an `Accordion.Panel` is ignored when `hiddenUntilFound` is enabled on the panel or root, since the panel must remain mounted while closed.');
      }
    }, [hiddenUntilFound, keepMountedProp]);
  }
  useIsoLayoutEffect(() => {
    setPanelIdState(currentId => registeredId ?? (currentId === null ? undefined : currentId));
    return () => {
      setPanelIdState(currentId => currentId === registeredId ? null : currentId);
    };
  }, [registeredId, setPanelIdState]);
  const {
    height,
    props,
    ref,
    shouldPreventOpenAnimation,
    shouldRender,
    transitionStatus: panelTransitionStatus,
    width
  } = useCollapsiblePanel({
    externalRef: forwardedRef,
    hiddenUntilFound,
    id,
    keepMounted,
    mounted,
    onOpenChange,
    open,
    setMounted,
    setOpen,
    transitionStatus
  });
  const {
    state,
    triggerId
  } = useAccordionItemContext();
  const panelState = {
    ...state,
    transitionStatus: panelTransitionStatus
  };
  const resolvedStyle = resolveStyle(style, panelState);
  const element = useRenderElement('div', {
    ...componentProps,
    style: undefined
  }, {
    state: panelState,
    ref,
    props: [props, {
      'aria-labelledby': triggerId,
      role: 'region',
      style: {
        [AccordionPanelCssVars.accordionPanelHeight]: height === undefined ? 'auto' : `${height}px`,
        [AccordionPanelCssVars.accordionPanelWidth]: width === undefined ? 'auto' : `${width}px`
      }
    }, elementProps, resolvedStyle ? {
      style: resolvedStyle
    } : undefined,
    // Resolve the public `style` prop so temporary `animationName: 'none'`
    // can still win after user's inline styles have been merged.
    shouldPreventOpenAnimation ? {
      style: {
        animationName: 'none'
      }
    } : undefined],
    stateAttributesMapping: accordionStateAttributesMapping
  });
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") AccordionPanel.displayName = "AccordionPanel";