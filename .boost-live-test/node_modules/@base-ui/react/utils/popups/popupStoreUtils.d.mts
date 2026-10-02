import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { type SyncedFloatingRootContextStore } from "../../floating-ui-react/hooks/useSyncedFloatingRootContext.mjs";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { PopupStoreState, PopupStoreContext, popupStoreSelectors, PopupTriggerDataStore } from "./store.mjs";
export declare const FOCUSABLE_POPUP_PROPS: {
  tabIndex: number;
  "data-base-ui-focusable": string;
};
/**
 * Returns the default `initialFocus` resolver for a popup. When opened by touch it focuses the
 * popup element itself to prevent the virtual keyboard from opening (required for Android
 * specifically; iOS handles this automatically). Otherwise it falls back to the default behavior.
 */
export declare function createDefaultInitialFocus(popupRef: React.RefObject<HTMLElement | null>): (interactionType: InteractionType) => true | HTMLElement | null;
type PopupStoreWithOpen<State extends PopupStoreState<unknown>, SetOpenEventDetails extends BaseUIChangeEventDetails<string>> = PopupTriggerDataStore<State> & Pick<SyncedFloatingRootContextStore<State>, 'useSyncedValue'> & {
  setOpen(open: boolean, eventDetails: SetOpenEventDetails): void;
};
/**
 * The subset of a popup handle that a Root needs to bind its store to. Both the real handle classes
 * and any test double satisfy it.
 */
export interface PopupRootStoreHandle<Store> {
  attachStore(store: Store): () => void;
}
/**
 * Creates and owns a popup store on behalf of a Root part. The store is created exactly once, with
 * controlled props and root state synced separately after creation. Sets up the synced floating
 * root context and returns the store.
 *
 * @param createStore Factory that builds the store. Called exactly once, receiving the floating id
 * and whether the popup is nested inside another floating element, both resolved on the first render.
 * @param treatPopupAsFloatingElement Whether the popup element is passed to Floating UI as the
 * floating element instead of the default positioner.
 */
export declare function usePopupRootStore<State extends PopupStoreState<unknown>, SetOpenEventDetails extends BaseUIChangeEventDetails<string>, Store extends PopupStoreWithOpen<State, SetOpenEventDetails>>(createStore: (floatingId: string | undefined, nested: boolean) => Store, treatPopupAsFloatingElement?: boolean): Store;
/**
 * Attaches a Root's store to a handle for this component's committed lifetime. Popup Roots render
 * it before their interactions and user children so its layout effect runs before descendant layout
 * effects. This lets descendants call the handle during the Root's initial commit without attaching
 * during render, which would leak suspended or abandoned stores. Store subscribers are notified by
 * `attachStore` in this ordinary layout phase, where React permits synchronous updates.
 *
 * Popup Roots must render this component only when a handle is present so handle-less Roots avoid
 * mounting an extra fiber and layout effect.
 */
export declare function PopupHandleAttachment<Store>({
  handle,
  store
}: {
  handle: PopupRootStoreHandle<Store>;
  store: Store;
}): null;
/**
 * Returns a stable callback ref that registers/unregisters the trigger element in the store.
 *
 * Stable so a downstream ref merger that retains the callback it was first given still reaches the
 * trigger's current store. The registration is tracked as a `(store, id, element)` triple, so
 * unregistering targets the store the element was actually registered in.
 *
 * Since the callback never changes, the caller must re-run it from a layout effect keyed on
 * `[store, id]` to migrate an already-registered element. That effect is also what registers the
 * element in the first place when `id` only resolves after the first commit (React 17's `useId`
 * fallback), because the register call made while the id is still `undefined` does nothing.
 *
 * @param id Id of the trigger.
 * @param store The Store instance where the trigger should be registered.
 */
export declare function useTriggerRegistration<State extends PopupStoreState<unknown>>(id: string | undefined, store: PopupTriggerDataStore<State>): (element: Element | null) => void;
type PopupOpenState = Pick<PopupStoreState<unknown>, 'open' | 'preventUnmountingOnClose' | 'activeTriggerId' | 'activeTriggerElement'>;
export declare function createPopupOpenState(state: PopupOpenState, open: boolean, trigger: Element | undefined, preventUnmountOnClose?: boolean): PopupOpenState;
export declare function attachPreventUnmountOnClose(eventDetails: {
  preventUnmountOnClose(): void;
}): () => boolean;
/**
 * Runs the shared open-change sequence for a popup store: notifies `onOpenChange`,
 * honors cancellation, dispatches the floating root change, maps the reason to an
 * `instantType`, and commits the state update (synchronously for hover so
 * `getAnimations()` observes it). Stores supply their own differences via
 * `extraState` (e.g. the last change reason) and `onBeforeDispatch` (e.g. updating
 * inline-rect coordinates).
 */
export declare function applyPopupOpenChange<State extends PopupStoreState<unknown> & {
  instantType?: 'delay' | 'dismiss' | 'focus' | undefined;
}, EventDetails extends BaseUIChangeEventDetails<string>, ExtraKey extends keyof State = never>(store: {
  readonly context: Pick<PopupStoreContext<EventDetails>, 'onOpenChange'>;
  readonly state: State;
  update<const Key extends keyof State>(state: Pick<State, Key>): void;
}, nextOpen: boolean, eventDetails: EventDetails & {
  preventUnmountOnClose(): void;
}, options?: {
  onBeforeDispatch?: (() => void) | undefined;
  extraState?: Pick<State, ExtraKey> | undefined;
}): void;
/**
 * Sets up trigger data forwarding to the store.
 *
 * @param triggerId Id of the trigger.
 * @param triggerElementRef Ref for the trigger DOM element.
 * @param store The Store instance managing the popup state.
 * @param stateUpdates An object with state updates to apply when the trigger is active.
 */
export declare function useTriggerDataForwarding<State extends PopupStoreState<unknown>, const Key extends keyof Omit<State, 'activeTriggerId' | 'activeTriggerElement'>>(triggerId: string | undefined, triggerElementRef: React.RefObject<Element | null>, store: PopupTriggerDataStore<State>, stateUpdates: Pick<State, Key>): {
  registerTrigger: (element: Element | null) => void;
  isMountedByThisTrigger: boolean;
};
export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;
/**
 * Keeps trigger registration state synchronized while the popup is open.
 *
 * When a popup opens without an explicit trigger id and exactly one trigger is registered, that
 * trigger is claimed as the active trigger. When the active trigger id is still registered but its
 * element changed, the active element is refreshed. When the active trigger id is missing from the
 * registry but the same element is still registered under a different id (e.g. the rendered trigger
 * carries its own DOM `id` that differs from Base UI's internal trigger id), the active id is
 * reassociated to the registered id instead of being treated as lost. When the active trigger
 * unregisters, the default path preserves existing ownership so non-closing popup families do not
 * silently claim a different trigger while staying open.
 *
 * If `closeOnActiveTriggerUnmount` is enabled, unregistering a previously resolved active trigger
 * requests a close after a microtask so a same-tick replacement trigger with the same id can
 * register first. An active trigger id that has not matched a registered trigger yet is treated as
 * pending and does not request a close.
 *
 * This should be called on the Root part.
 *
 * @param store The Store instance managing the popup state.
 * @param options Options for active trigger unmount behavior.
 */
export declare function useImplicitActiveTrigger<State extends PopupStoreState<unknown>>(store: PopupStoreWithOpen<State, BaseUIChangeEventDetails<typeof REASONS.none>>, options?: {
  closeOnActiveTriggerUnmount?: boolean | undefined;
}): void;
/**
 * Manages the mounted state of the popup.
 * Sets up the transition status listeners and handles unmounting when needed.
 * Updates the `mounted`, `transitionStatus`, and `preventUnmountingOnClose` states in the store.
 *
 * @param open Whether the popup is open.
 * @param store The Store instance managing the popup state.
 * @param onUnmount Optional callback to be called when the popup is unmounted.
 * @param animateInitialOpen Whether a popup that mounts already open should still play its enter
 *   transition. Defaults to `false`, so content that was open on the first render (a `defaultOpen`
 *   popup on page load, SSR'd markup) appears without animating. Opt in for popups whose subtree
 *   only mounts in response to something the user did, such as a submenu inside a menu popup.
 *
 * @returns A function to forcibly unmount the popup.
 */
export declare function useOpenStateTransitions<State extends PopupStoreState<unknown>>(open: boolean, store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>, onUnmount?: () => void, animateInitialOpen?: boolean): {
  forceUnmount: () => void;
  transitionStatus: import("../../internals/useTransitionStatus.mjs").TransitionStatus;
};
type PopupInteractionPropKey = 'activeTriggerProps' | 'inactiveTriggerProps' | 'popupProps';
export declare function usePopupInteractionProps<State extends PopupStoreState<unknown>, const Key extends keyof State>(store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>, statePart: Pick<State, Key | PopupInteractionPropKey>): void;
export declare function usePopupRootSync<State extends PopupStoreState<unknown> & {
  openMethod: InteractionType | null;
}>(store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>, open: boolean): void;
export {};