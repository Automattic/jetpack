import * as React from 'react';
import type { Side, UseAnchorPositioningReturnValue } from "../../internals/useAnchorPositioning.js";
export interface SelectPositionerContext extends Omit<UseAnchorPositioningReturnValue, 'side'> {
  side: 'none' | Side;
  alignItemWithTriggerActive: boolean;
  setControlledAlignItemWithTrigger: React.Dispatch<React.SetStateAction<boolean>>;
  scrollUpArrowRef: React.RefObject<HTMLDivElement | null>;
  scrollDownArrowRef: React.RefObject<HTMLDivElement | null>;
}
export declare const SelectPositionerContext: React.Context<SelectPositionerContext | undefined>;
export declare function useSelectPositionerContext(): SelectPositionerContext;