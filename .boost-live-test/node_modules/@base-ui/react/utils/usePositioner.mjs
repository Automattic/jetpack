'use client';

import { popupStateMapping } from "./popupStateMapping.mjs";
import { useRenderElement } from "../internals/useRenderElement.mjs";
import { getDisabledMountTransitionStyles } from "../internals/getDisabledMountTransitionStyles.mjs";
/**
 * Renders the shared outer Positioner element used by popup components.
 * Applies the common role, hidden state, transition styles, state attributes, and optional inert styling.
 */
export function usePositioner(componentProps, state, {
  styles,
  transitionStatus,
  props,
  refs,
  hidden,
  inert = false
}) {
  const style = {
    ...styles
  };
  if (inert) {
    style.pointerEvents = 'none';
  }
  return useRenderElement('div', componentProps, {
    state,
    ref: refs,
    props: [{
      role: 'presentation',
      hidden,
      style
    }, getDisabledMountTransitionStyles(transitionStatus), props],
    stateAttributesMapping: popupStateMapping
  });
}