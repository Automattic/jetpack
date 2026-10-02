import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
export declare const stateAttributesMapping: {
  transitionStatus(value: TransitionStatus): Record<string, string> | null;
  valid(value: boolean | null): Record<string, string> | null;
  checked(value: boolean): Record<string, string>;
};