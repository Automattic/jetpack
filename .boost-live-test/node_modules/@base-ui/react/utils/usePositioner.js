"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePositioner = usePositioner;
var _popupStateMapping = require("./popupStateMapping");
var _useRenderElement = require("../internals/useRenderElement");
var _getDisabledMountTransitionStyles = require("../internals/getDisabledMountTransitionStyles");
/**
 * Renders the shared outer Positioner element used by popup components.
 * Applies the common role, hidden state, transition styles, state attributes, and optional inert styling.
 */
function usePositioner(componentProps, state, {
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
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: refs,
    props: [{
      role: 'presentation',
      hidden,
      style
    }, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), props],
    stateAttributesMapping: _popupStateMapping.popupStateMapping
  });
}