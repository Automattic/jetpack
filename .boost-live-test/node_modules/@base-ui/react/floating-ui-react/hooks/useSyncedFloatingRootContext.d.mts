import type { ReactStore } from '@base-ui/utils/store';
import { BaseUIChangeEventDetails } from "../../types/index.mjs";
import { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from "../../utils/popups/index.mjs";
import { FloatingRootStore } from "../components/FloatingRootStore.mjs";
/**
 * Narrowed to the store members this hook uses so consumers do not need to provide
 * unrelated store capabilities.
 */
export type SyncedFloatingRootContextStore<State extends PopupStoreState<unknown>> = Pick<ReactStore<Readonly<State>, PopupStoreContext<never>, PopupStoreSelectors>, 'context' | 'state' | 'useState' | 'useSyncedValue'>;
export interface UseSyncedFloatingRootContextOptions<State extends PopupStoreState<unknown>, OpenChangeEventDetails extends BaseUIChangeEventDetails<string>> {
  popupStore: SyncedFloatingRootContextStore<State>;
  /**
   * Whether the Popup element is passed to Floating UI as the floating element instead of the default Positioner.
   */
  treatPopupAsFloatingElement?: boolean | undefined;
  floatingRootContext?: FloatingRootStore | undefined;
  floatingId: string | undefined;
  nested: boolean;
  onOpenChange(open: boolean, eventDetails: OpenChangeEventDetails): void;
}
/**
 * Keeps a FloatingRootStore in sync with the provided PopupStore.
 * Uses the provided FloatingRootStore when one exists, otherwise creates one once and updates it on every render.
 */
export declare function useSyncedFloatingRootContext<State extends PopupStoreState<unknown>, OpenChangeEventDetails extends BaseUIChangeEventDetails<string>>(options: UseSyncedFloatingRootContextOptions<State, OpenChangeEventDetails>): FloatingRootStore;