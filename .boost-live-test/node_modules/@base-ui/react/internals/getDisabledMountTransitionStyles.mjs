import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { DISABLED_TRANSITIONS_STYLE } from "./constants.mjs";
export function getDisabledMountTransitionStyles(transitionStatus) {
  return transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT;
}