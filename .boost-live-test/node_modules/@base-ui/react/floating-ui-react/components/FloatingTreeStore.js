"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FloatingTreeStore = void 0;
var _createEventEmitter = require("../utils/createEventEmitter");
/**
 * Stores and manages floating elements in a tree structure.
 * This is a backing store for the `FloatingTree` component.
 */
class FloatingTreeStore {
  nodesRef = {
    current: []
  };
  events = (0, _createEventEmitter.createEventEmitter)();
  addNode(node) {
    this.nodesRef.current.push(node);
  }
  removeNode(node) {
    const index = this.nodesRef.current.findIndex(n => n === node);
    if (index !== -1) {
      this.nodesRef.current.splice(index, 1);
    }
  }
}
exports.FloatingTreeStore = FloatingTreeStore;