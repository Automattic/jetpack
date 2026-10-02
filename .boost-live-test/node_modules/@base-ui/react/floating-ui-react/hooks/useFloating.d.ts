import { FloatingRootStore } from "../components/FloatingRootStore.js";
import type { UseFloatingOptions, UseFloatingReturn } from "../types.js";
/**
 * Provides data to position a floating element and context to add interactions.
 * @see https://floating-ui.com/docs/useFloating
 */
export declare function useFloating(options?: UseFloatingOptions): UseFloatingReturn;
/**
 * Base UI's private `useFloating` path. The caller must supply the root store, so this skips the
 * internal root-context hook used by the public Floating UI-compatible API.
 */
export declare function useBaseUIFloating(options: UseFloatingOptions & {
  rootContext: FloatingRootStore;
}): UseFloatingReturn;