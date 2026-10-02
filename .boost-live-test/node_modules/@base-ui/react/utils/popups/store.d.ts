import type { ReactStore } from '@base-ui/utils/store';
import { FloatingRootContext } from "../../floating-ui-react/index.js";
import { FloatingRootStore } from "../../floating-ui-react/components/FloatingRootStore.js";
import { TransitionStatus } from "../../internals/useTransitionStatus.js";
import { PopupTriggerMap } from "./popupTriggerMap.js";
import { HTMLProps } from "../../internals/types.js";
/**
 * State common to all popup stores.
 */
export type PopupStoreState<Payload> = {
  /**
   * Whether the popup is open (internal state).
   */
  open: boolean;
  /**
   * Whether the popup is open (external prop).
   */
  readonly openProp: boolean | undefined;
  /**
   * Whether the popup should be mounted in the DOM.
   * This usually follows `open` but can be different during exit transitions.
   */
  mounted: boolean;
  /**
   * The current enter/exit transition status of the popup.
   */
  transitionStatus: TransitionStatus;
  floatingRootContext: FloatingRootContext;
  floatingId: string | undefined;
  /**
   * Number of trigger elements currently registered for this popup.
   */
  triggerCount: number;
  /**
   * Whether to prevent unmounting the popup when closed.
   * Useful for interacting with JS animation libraries that control unmounting themselves.
   */
  preventUnmountingOnClose: boolean;
  /**
   * Optional payload set by the trigger.
   */
  payload: Payload | undefined;
  /**
   * ID of the currently active trigger.
   */
  activeTriggerId: string | null;
  /**
   * The currently active trigger DOM element.
   */
  activeTriggerElement: Element | null;
  /**
   * ID of the trigger (external prop).
   */
  readonly triggerIdProp: string | null | undefined;
  /**
   * The popup DOM element.
   */
  popupElement: HTMLElement | null;
  /**
   * The positioner DOM element.
   */
  positionerElement: HTMLElement | null;
  /**
   * Props to spread onto the active trigger element.
   */
  activeTriggerProps: HTMLProps;
  /**
   * Props to spread onto inactive trigger elements.
   */
  inactiveTriggerProps: HTMLProps;
  /**
   * Props to spread onto the popup element.
   */
  popupProps: HTMLProps;
};
export declare function createInitialPopupStoreState<Payload>(triggerElements: PopupTriggerMap, floatingId?: string | undefined, nested?: boolean): PopupStoreState<Payload>;
export type PopupStoreContext<ChangeEventDetails> = {
  /**
   * Map of registered trigger elements.
   */
  readonly triggerElements: PopupTriggerMap;
  /**
   * Reference to the popup element.
   */
  readonly popupRef: React.RefObject<HTMLElement | null>;
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?: ((open: boolean, eventDetails: ChangeEventDetails) => void) | undefined;
  /**
   * Callback fired when the open state change animation completes.
   */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};
type S = PopupStoreState<unknown>;
declare const activeTriggerIdSelector: (state: S) => string | null;
declare const openSelector: (state: S) => boolean;
declare const popupIdSelector: (state: S) => string | undefined;
export declare const popupStoreSelectors: {
  open: typeof openSelector;
  mounted: (state: S) => boolean;
  transitionStatus: (state: S) => TransitionStatus;
  floatingRootContext: (state: S) => FloatingRootStore;
  triggerCount: (state: S) => number;
  preventUnmountingOnClose: (state: S) => boolean;
  payload: (state: S) => unknown;
  activeTriggerId: typeof activeTriggerIdSelector;
  activeTriggerElement: (state: S) => Element | null;
  popupId: typeof popupIdSelector;
  /**
   * Whether the trigger with the given ID was used to open the popup.
   */
  isTriggerActive: (state: S, triggerId: string | undefined) => boolean;
  /**
   * Whether the popup is open and was activated by a trigger with the given ID.
   */
  isOpenedByTrigger: (state: S, triggerId: string | undefined) => boolean;
  /**
   * Whether the popup is mounted and was activated by a trigger with the given ID.
   */
  isMountedByTrigger: (state: S, triggerId: string | undefined) => boolean;
  triggerProps: (state: S, isActive: boolean) => HTMLProps;
  /**
   * Popup id for the trigger that currently owns the open popup.
   */
  triggerPopupId: (state: S, triggerId: string | undefined) => string | undefined;
  popupProps: (state: S) => HTMLProps;
  popupElement: (state: S) => HTMLElement | null;
  positionerElement: (state: S) => HTMLElement | null;
};
export type PopupStoreSelectors = typeof popupStoreSelectors;
/**
 * Store members a detached handle-backed trigger reads or invokes for trigger registration and data
 * forwarding. `set`/`update` are included only for trigger-count and trigger-data bookkeeping; on a
 * detached (inert) store they are intentionally no-ops, so a write through them is not guaranteed to
 * be durable. Component handle-store views Pick these from their concrete store (preserving its
 * context and selectors) and add any component-specific trigger-invoked members such as `setOpen`.
 */
export type PopupTriggerStoreKeys = 'context' | 'select' | 'set' | 'state' | 'update' | 'useState';
/**
 * The subset of a popup store that trigger registration and data forwarding rely on. Narrow enough
 * that an inert store can be passed while detached.
 */
export type PopupTriggerDataStore<State extends PopupStoreState<unknown>> = Pick<ReactStore<Readonly<State>, PopupStoreContext<never>, PopupStoreSelectors>, PopupTriggerStoreKeys>;
export {};