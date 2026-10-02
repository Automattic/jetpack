import type { BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { FloatingRootStore } from "../components/FloatingRootStore.mjs";
import type { ReferenceType } from "../types.mjs";
export interface UseFloatingRootContextOptions {
  open?: boolean | undefined;
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  elements?: {
    reference?: ReferenceType | null | undefined;
    floating?: HTMLElement | null | undefined;
  } | undefined;
}
export declare function useFloatingRootContext(options: UseFloatingRootContextOptions): FloatingRootStore;