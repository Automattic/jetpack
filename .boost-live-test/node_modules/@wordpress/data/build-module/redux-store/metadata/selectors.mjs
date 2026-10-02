// packages/data/src/redux-store/metadata/selectors.ts
import deprecated from "@wordpress/deprecated";
import { createSelector } from "../../create-selector.mjs";
import { selectorArgsToStateKey } from "./utils.mjs";
function getResolutionState(state, selectorName, args) {
  const map = state[selectorName];
  if (!map) {
    return;
  }
  return map.get(selectorArgsToStateKey(args));
}
function getIsResolving(state, selectorName, args) {
  deprecated("wp.data.select( store ).getIsResolving", {
    since: "6.6",
    version: "6.8",
    alternative: "wp.data.select( store ).getResolutionState"
  });
  const resolutionState = getResolutionState(state, selectorName, args);
  return resolutionState && resolutionState.status === "resolving";
}
function hasStartedResolution(state, selectorName, args) {
  return getResolutionState(state, selectorName, args) !== void 0;
}
function hasFinishedResolution(state, selectorName, args) {
  const status = getResolutionState(state, selectorName, args)?.status;
  return status === "finished" || status === "error";
}
function hasResolutionFailed(state, selectorName, args) {
  return getResolutionState(state, selectorName, args)?.status === "error";
}
function getResolutionError(state, selectorName, args) {
  const resolutionState = getResolutionState(state, selectorName, args);
  return resolutionState?.status === "error" ? resolutionState.error : null;
}
function isResolving(state, selectorName, args) {
  return getResolutionState(state, selectorName, args)?.status === "resolving";
}
function getCachedResolvers(state) {
  return state;
}
function hasResolvingSelectors(state) {
  return Object.values(state).some(
    (selectorState) => (
      /**
       * This uses the internal `_map` property of `EquivalentKeyMap` for
       * optimization purposes, since the `EquivalentKeyMap` implementation
       * does not support a `.values()` implementation.
       *
       * @see https://github.com/aduth/equivalent-key-map
       */
      Array.from(selectorState._map.values()).some(
        (resolution) => resolution[1]?.status === "resolving"
      )
    )
  );
}
var countSelectorsByStatus = createSelector(
  (state) => {
    const selectorsByStatus = {};
    Object.values(state).forEach(
      (selectorState) => (
        /**
         * This uses the internal `_map` property of `EquivalentKeyMap` for
         * optimization purposes, since the `EquivalentKeyMap` implementation
         * does not support a `.values()` implementation.
         *
         * @see https://github.com/aduth/equivalent-key-map
         */
        Array.from(selectorState._map.values()).forEach(
          (resolution) => {
            const currentStatus = resolution[1]?.status ?? "error";
            if (!selectorsByStatus[currentStatus]) {
              selectorsByStatus[currentStatus] = 0;
            }
            selectorsByStatus[currentStatus]++;
          }
        )
      )
    );
    return selectorsByStatus;
  },
  (state) => [state]
);
export {
  countSelectorsByStatus,
  getCachedResolvers,
  getIsResolving,
  getResolutionError,
  getResolutionState,
  hasFinishedResolution,
  hasResolutionFailed,
  hasResolvingSelectors,
  hasStartedResolution,
  isResolving
};
//# sourceMappingURL=selectors.mjs.map
