// packages/compose/src/utils/observable-map/index.ts
function observableMap() {
  const map = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Map();
  function callListeners(name) {
    const list = listeners.get(name);
    if (!list) {
      return;
    }
    for (const listener of list) {
      listener();
    }
  }
  return {
    get(name) {
      return map.get(name);
    },
    set(name, value) {
      map.set(name, value);
      callListeners(name);
    },
    delete(name) {
      map.delete(name);
      callListeners(name);
    },
    subscribe(name, listener) {
      let list = listeners.get(name);
      if (!list) {
        list = /* @__PURE__ */ new Set();
        listeners.set(name, list);
      }
      list.add(listener);
      return () => {
        list.delete(listener);
        if (list.size === 0) {
          listeners.delete(name);
        }
      };
    }
  };
}
export {
  observableMap
};
//# sourceMappingURL=index.mjs.map
