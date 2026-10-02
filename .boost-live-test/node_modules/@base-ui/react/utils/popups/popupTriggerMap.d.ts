/**
 * Data structure to keep track of popup trigger elements by their IDs.
 *
 * Element lookups iterate the id map rather than maintaining a parallel Set. Registration is O(1),
 * while `hasElement` and `hasMatchingElement` are linear in the number of triggers.
 */
export declare class PopupTriggerMap {
  private idMap;
  constructor();
  /**
   * Adds a trigger element with the given ID.
   *
   * Note: The provided element is assumed to not be registered under multiple IDs.
   */
  add(id: string, element: Element): void;
  /**
   * Removes the trigger element with the given ID.
   */
  delete(id: string): void;
  /**
   * Whether the given element is registered as a trigger.
   */
  hasElement(element: Element): boolean;
  /**
   * Whether there is a registered trigger element matching the given predicate.
   */
  hasMatchingElement(predicate: (el: Element) => boolean): boolean;
  /**
   * Returns the trigger element associated with the given ID, or undefined if no such element exists.
   */
  getById(id: string): Element | undefined;
  /**
   * Returns an iterable of all registered trigger entries, where each entry is a tuple of [id, element].
   */
  entries(): IterableIterator<[string, Element]>;
  /**
   * Returns an iterable of all registered trigger elements.
   */
  elements(): IterableIterator<Element>;
  /**
   * Returns the number of registered trigger elements.
   */
  get size(): number;
}