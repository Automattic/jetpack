/**
 * Enqueued callback to invoke once idle time permits.
 */
export type WPPriorityQueueCallback = VoidFunction;
/**
 * An object used to associate callbacks in a particular context grouping.
 */
export type WPPriorityQueueContext = object;
/**
 * Interface for the priority queue instance.
 */
export interface WPPriorityQueue {
    /**
     * Add a callback to the queue for a given context.
     */
    add: (element: WPPriorityQueueContext, item: WPPriorityQueueCallback) => void;
    /**
     * Flush and run the callback for a given context immediately.
     * @return true if a callback was run, false otherwise.
     */
    flush: (element: WPPriorityQueueContext) => boolean;
    /**
     * Cancel (remove) the callback for a given context without running it.
     * @return true if a callback was cancelled, false otherwise.
     */
    cancel: (element: WPPriorityQueueContext) => boolean;
    /**
     * Reset the entire queue, clearing pending callbacks.
     */
    reset: VoidFunction;
}
/**
 * Creates a context-aware queue that only executes
 * the last task of a given context.
 *
 * @example
 *```js
 * import { createQueue } from '@wordpress/priority-queue';
 *
 * const queue = createQueue();
 *
 * // Context objects.
 * const ctx1 = {};
 * const ctx2 = {};
 *
 * // For a given context in the queue, only the last callback is executed.
 * queue.add( ctx1, () => console.log( 'This will be printed first' ) );
 * queue.add( ctx2, () => console.log( 'This won\'t be printed' ) );
 * queue.add( ctx2, () => console.log( 'This will be printed second' ) );
 *```
 *
 * @return {WPPriorityQueue} Queue object with `add`, `flush` and `reset` methods.
 */
export declare const createQueue: () => WPPriorityQueue;
//# sourceMappingURL=index.d.ts.map