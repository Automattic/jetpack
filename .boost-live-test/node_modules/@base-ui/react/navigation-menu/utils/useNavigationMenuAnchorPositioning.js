"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useNavigationMenuAnchorPositioning = useNavigationMenuAnchorPositioning;
var _useFloating = require("../../floating-ui-react/hooks/useFloating");
var _useAnchorPositioning = require("../../internals/useAnchorPositioning");
/**
 * Positioning path for the Navigation Menu, whose active trigger supplies its root store after the
 * positioner has already rendered.
 */
function useNavigationMenuAnchorPositioning(params) {
  return (0, _useAnchorPositioning.useAnchorPositioningWithHook)(params, _useFloating.useFloating);
}