import * as React from 'react';
import type { ReactStore } from '@base-ui/utils/store';
import type { StateAttributesMapping } from "../internals/getStateAttributesProps.js";
import { Side } from "../internals/useAnchorPositioning.js";
export declare const popupViewportStateMapping: StateAttributesMapping<{
  activationDirection: string | undefined;
}>;
export interface PopupViewportState {
  /**
   * Direction from which the popup was activated, used for directional animations.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
}
type PopupViewportStore = Pick<ReactStore<any, any, any>, 'useState' | 'set'>;
export interface UsePopupViewportParameters {
  /**
   * Popup store instance for accessing shared popup state.
   */
  store: PopupViewportStore;
  /**
   * Side of the positioner relative to the trigger.
   */
  side: Side;
  /**
   * Viewport children to render in the current container.
   */
  children?: React.ReactNode;
}
export interface UsePopupViewportResult {
  /**
   * The viewport children wrapped in current/previous containers as needed.
   */
  children: React.ReactNode;
  /**
   * Viewport state used for data attributes and render prop styling.
   */
  state: PopupViewportState;
}
/**
 * Builds morphing viewport containers for popups that animate between trigger-based content.
 * Handles previous-content snapshots, auto-resize, and state attributes for transitions.
 */
export declare function usePopupViewport(parameters: UsePopupViewportParameters): UsePopupViewportResult;
export {};