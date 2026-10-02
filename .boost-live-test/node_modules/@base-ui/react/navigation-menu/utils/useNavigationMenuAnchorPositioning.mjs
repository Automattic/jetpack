'use client';

import { useFloating } from "../../floating-ui-react/hooks/useFloating.mjs";
import { useAnchorPositioningWithHook } from "../../internals/useAnchorPositioning.mjs";

/**
 * Positioning path for the Navigation Menu, whose active trigger supplies its root store after the
 * positioner has already rendered.
 */
export function useNavigationMenuAnchorPositioning(params) {
  return useAnchorPositioningWithHook(params, useFloating);
}