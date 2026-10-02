"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEventEmitter = createEventEmitter;
function createEventEmitter() {
  const map = new Map();
  return {
    emit(event, data) {
      map.get(event)?.forEach(listener => listener(data));
    },
    on(event, listener) {
      if (!map.has(event)) {
        map.set(event, new Set());
      }
      map.get(event).add(listener);
    },
    off(event, listener) {
      map.get(event)?.delete(listener);
    }
  };
}