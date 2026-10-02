import { createEventEmitter } from "../utils/createEventEmitter.mjs";

/**
 * Stores and manages floating elements in a tree structure.
 * This is a backing store for the `FloatingTree` component.
 */
export class FloatingTreeStore {
  nodesRef = {
    current: []
  };
  events = createEventEmitter();
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