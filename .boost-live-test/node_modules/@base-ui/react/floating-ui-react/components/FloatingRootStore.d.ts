import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import type { FloatingEvents, ContextData, ReferenceType } from "../types.js";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.js";
import { type PopupTriggerMap } from "../../utils/popups/index.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
export interface FloatingRootState {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
  domReferenceElement: Element | null;
  referenceElement: ReferenceType | null;
  floatingElement: HTMLElement | null;
  positionReference: ReferenceType | null;
  /**
   * The ID of the floating element.
   */
  floatingId: string | undefined;
}
export interface FloatingRootStoreContext {
  onOpenChange: ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
  readonly dataRef: React.RefObject<ContextData>;
  readonly events: FloatingEvents;
  nested: boolean;
  readonly triggerElements: PopupTriggerMap;
}
declare const selectors: {
  open: (state: FloatingRootState) => boolean;
  transitionStatus: (state: FloatingRootState) => TransitionStatus;
  domReferenceElement: (state: FloatingRootState) => Element | null;
  referenceElement: (state: FloatingRootState) => ReferenceType | null;
  floatingElement: (state: FloatingRootState) => HTMLElement | null;
  floatingId: (state: FloatingRootState) => string | undefined;
};
interface FloatingRootStoreOptions {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
  referenceElement: ReferenceType | null;
  floatingElement: HTMLElement | null;
  triggerElements: PopupTriggerMap;
  floatingId: string | undefined;
  /**
   * When true, `setOpen` only forwards to `onOpenChange`.
   * The popup store owns `dispatchOpenChange(...)` in this mode.
   */
  syncOnly: boolean;
  nested: boolean;
  onOpenChange: ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}
export declare class FloatingRootStore extends ReactStore<Readonly<FloatingRootState>, FloatingRootStoreContext, typeof selectors> {
  private readonly syncOnly;
  constructor(options: FloatingRootStoreOptions);
  /**
   * Syncs the event used by hover logic to distinguish hover-open from click-like interaction.
   */
  syncOpenEvent: (newOpen: boolean, event: Event | undefined) => void;
  /**
   * Runs the root-owned side effects for an open state change.
   */
  dispatchOpenChange: (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void;
  /**
   * Emits the `openchange` event through the internal event emitter and calls the `onOpenChange` handler with the provided arguments.
   *
   * @param newOpen The new open state.
   * @param eventDetails Details about the event that triggered the open state change.
   */
  setOpen: (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void;
}
export {};