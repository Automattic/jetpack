import type { TransitionStatus } from "./useTransitionStatus.js";
import * as TransitionStatusDataAttributes from "./TransitionStatusDataAttributes.js";
export { TransitionStatusDataAttributes };
export declare const transitionStatusMapping: {
  transitionStatus(value: TransitionStatus): Record<string, string> | null;
};