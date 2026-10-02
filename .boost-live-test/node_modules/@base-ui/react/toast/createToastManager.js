"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createToastManager = createToastManager;
var _generateId = require("@base-ui/utils/generateId");
/**
 * Creates a new toast manager.
 */
function createToastManager() {
  const listeners = new Set();
  function emit(data) {
    listeners.forEach(listener => listener(data));
  }
  return {
    // This should be private aside from ToastProvider needing to access it.
    // https://x.com/drosenwasser/status/1816947740032872664
    ' subscribe': function subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    add(options) {
      const id = options.id || (0, _generateId.generateId)('toast');
      const toastToAdd = {
        ...options,
        id,
        transitionStatus: 'starting'
      };
      emit({
        action: 'add',
        options: toastToAdd
      });
      return id;
    },
    close(id) {
      emit({
        action: 'close',
        options: {
          id
        }
      });
    },
    update(id, updates) {
      emit({
        action: 'update',
        options: {
          id,
          updates
        }
      });
    },
    promise(promiseValue, options) {
      let handledPromise = promiseValue;
      emit({
        action: 'promise',
        options: {
          ...options,
          promise: promiseValue,
          setPromise(promise) {
            handledPromise = promise;
          }
        }
      });
      return handledPromise;
    }
  };
}