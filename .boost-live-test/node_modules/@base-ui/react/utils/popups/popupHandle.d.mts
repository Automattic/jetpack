import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import type { PopupTriggerMap } from "./popupTriggerMap.mjs";
/**
 * Minimal store contract exposed by popup handles to detached triggers.
 *
 * Detached triggers read `store` during render and subscribe to be notified when the handle switches
 * between its fallback store and a root's live store.
 *
 * @template HandleStore Store shape exposed to detached triggers.
 */
export interface PopupHandleStoreProvider<HandleStore> {
  /**
   * Store currently exposed by the handle.
   */
  readonly store: HandleStore;
  /**
   * Subscribes to changes of the exposed store pointer.
   *
   * @param listener Callback fired when the handle starts or stops pointing at a root store.
   * @returns Cleanup function that removes the listener.
   */
  subscribeStore(listener: () => void): () => void;
}
/**
 * Store shape holding a trigger registry, required by `BasePopupHandle.openByTrigger` to resolve a
 * trigger element by id on both the attached root's store and the fallback store.
 */
export interface PopupHandleStoreWithTriggers {
  readonly context: {
    readonly triggerElements: PopupTriggerMap;
  };
}
/**
 * Store shape required by `BasePopupHandle.openByTrigger`/`closePopup` to drive open/close state.
 * Only the root-owned `Store` needs this — the `HandleStore` view exposed to detached triggers may
 * omit `setOpen` entirely (as Dialog and PreviewCard's do) since it is never called while detached.
 */
export interface PopupHandleStoreWithOpen extends PopupHandleStoreWithTriggers {
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<typeof REASONS.imperativeAction>): void;
}
/**
 * Shared implementation for popup handles that coordinate detached triggers with a mounted root.
 *
 * Subclasses provide the component-specific imperative methods, while this base class owns the
 * fallback store, root store attachment stack, subscriber notifications, and development warning for
 * overlapping roots.
 *
 * @template HandleStore Store shape exposed to detached triggers.
 * @template Store Root-owned store attached by the component root.
 */
export declare class BasePopupHandle<HandleStore extends PopupHandleStoreWithTriggers, Store extends HandleStore & PopupHandleStoreWithOpen> {
  protected readonly fallbackStore: HandleStore;
  private readonly componentName;
  private readonly throwOnMissingTrigger;
  /**
   * Stores of every root currently using this handle, in attach order. A handle is meant to be used
   * by a single mounted root, but roots can transiently overlap (e.g. during an animated route
   * transition), so this stack lets `attachStore`'s cleanup restore the previous root instead of
   * leaving a still-mounted root uncontrollable when a newer overlapping root detaches first.
   */
  private readonly attachedStores;
  /**
   * Store of the root that currently controls the handle: the most recently attached one still
   * mounted, or `null` when no root is attached. Imperative methods are no-ops while this is `null`.
   */
  private attachedStoreValue;
  /**
   * Listeners notified when `attachedStore` changes, so detached triggers can follow the store pointer.
   */
  private readonly storeListeners;
  /**
   * Creates a handle backed by the store used while no root is attached.
   *
   * @param fallbackStore Inert, closed store handed to detached triggers while no root is attached,
   * so they can render and register without a mounted root. Triggers register into whichever store
   * `store` currently resolves to, so while detached they live in this store's trigger map and
   * migrate themselves to the root's store (and back) as it attaches/detaches.
   * @param componentName Component name used to prefix dev warnings, e.g. `'Menu'` produces
   * `MenuHandle.open()` in warning text.
   * @param throwOnMissingTrigger Whether `open(triggerId)` throws when no trigger with that id is
   * registered. Anchored popups (Menu, Popover, Tooltip, PreviewCard) need a trigger to anchor to,
   * so they throw; Dialog is not anchored and instead opens unassociated with a dev warning.
   */
  constructor(fallbackStore: HandleStore, componentName: string, throwOnMissingTrigger?: boolean);
  protected get attachedStore(): Store | null;
  /**
   * Sets the store that currently controls the handle and notifies subscribers when it changes, so
   * detached triggers re-render and migrate their registration to the new store.
   */
  private setActiveStore;
  /**
   * Opens the attached root's store and associates it with the trigger with the given id, or a
   * no-op (with a dev warning) while no root is attached. Shared by every concrete handle's public
   * `open()` method, which only narrows the parameter type.
   *
   * When a trigger id is given but no matching trigger is registered, anchored popups throw (see
   * `throwOnMissingTrigger`); Dialog opens unassociated with a dev warning instead.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the popup, or `null`/`undefined` to open
   * without associating any trigger.
   */
  protected openByTrigger(triggerId: string | null | undefined): void;
  /**
   * Closes the popup by setting the attached root's store to closed, or a no-op (with a dev warning)
   * while no root is attached. Shared by every concrete handle's public `close()` method.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  protected closePopup(): void;
}