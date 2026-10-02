import type { FloatingNodeType, FloatingEvents } from "../types.js";
/**
 * Stores and manages floating elements in a tree structure.
 * This is a backing store for the `FloatingTree` component.
 */
export declare class FloatingTreeStore {
  readonly nodesRef: React.RefObject<Array<FloatingNodeType>>;
  readonly events: FloatingEvents;
  addNode(node: FloatingNodeType): void;
  removeNode(node: FloatingNodeType): void;
}