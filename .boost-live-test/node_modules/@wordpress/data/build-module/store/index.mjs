// packages/data/src/store/index.ts
var coreDataStore = {
  name: "core/data",
  instantiate(registry) {
    const getCoreDataSelector = (selectorName) => (key, ...args) => {
      return registry.select(key)[selectorName](...args);
    };
    const getCoreDataAction = (actionName) => (key, ...args) => {
      return registry.dispatch(key)[actionName](...args);
    };
    return {
      getSelectors() {
        return Object.fromEntries(
          [
            "getIsResolving",
            "hasStartedResolution",
            "hasFinishedResolution",
            "isResolving",
            "getCachedResolvers"
          ].map((selectorName) => [
            selectorName,
            getCoreDataSelector(selectorName)
          ])
        );
      },
      getActions() {
        return Object.fromEntries(
          [
            "startResolution",
            "finishResolution",
            "invalidateResolution",
            "invalidateResolutionForStore",
            "invalidateResolutionForStoreSelector"
          ].map((actionName) => [
            actionName,
            getCoreDataAction(actionName)
          ])
        );
      },
      subscribe() {
        return () => () => {
        };
      }
    };
  }
};
var store_default = coreDataStore;
export {
  store_default as default
};
//# sourceMappingURL=index.mjs.map
