import type { TransitionStatus } from "./useTransitionStatus.mjs";
import * as TransitionStatusDataAttributes from "./TransitionStatusDataAttributes.mjs";
export { TransitionStatusDataAttributes };
export declare const transitionStatusMapping: {
  transitionStatus(value: TransitionStatus): Record<string, string> | null;
};