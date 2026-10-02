import * as React from 'react';
import type { SelectStore } from "../store.mjs";
import type { HTMLProps } from "../../internals/types.mjs";
/**
 * Root values consumed during render. Keep these outside `useSyncedValues` so descendant ref
 * callbacks see the current props during the same commit.
 */
export interface SelectRootPropsContextValue {
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  multiple: boolean;
  highlightItemOnHover: boolean;
  itemProps: HTMLProps;
}
export declare const SelectRootContext: React.Context<SelectStore | undefined>;
export declare const SelectRootPropsContext: React.Context<SelectRootPropsContextValue | undefined>;
export declare const SelectFloatingContext: React.Context<import("../../floating-ui-react/components/FloatingRootStore.mjs").FloatingRootStore | undefined>;
export declare function useSelectRootContext(): SelectStore;
export declare function useSelectRootPropsContext(): SelectRootPropsContextValue;
export declare function useSelectFloatingContext(): import("../../floating-ui-react/components/FloatingRootStore.mjs").FloatingRootStore;