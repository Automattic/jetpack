/**
 * Write — undo/redo history stack.
 *
 * Pure module: no DOM or Interactivity API dependencies.
 * Each snapshot is an opaque object; callers attach whatever fields they need
 * (html, title, cursor, …).
 */

/**
 * @typedef {{ html: string, title: string, cursor?: * }} Snapshot
 */

/**
 * Create a bounded undo/redo history stack.
 *
 * @param {{ maxSize?: number }} options           - Configuration options.
 * @param {number}               [options.maxSize] - Maximum number of snapshots to retain (default 100).
 * @return {object} History instance with push, undo, redo, canUndo, canRedo, and current.
 */
export function createUndoHistory( { maxSize = 100 } = {} ) {
	/** @type {Snapshot[]} */
	const stack = [];
	let position = -1;

	return {
		push( snapshot ) {
			// Discard any redo future.
			stack.splice( position + 1 );
			stack.push( snapshot );
			// Evict oldest entry when the stack exceeds maxSize.
			if ( stack.length > maxSize ) {
				stack.shift();
			}
			position = stack.length - 1;
		},

		undo() {
			if ( position > 0 ) {
				position--;
			}
			return stack[ position ] ?? null;
		},

		redo() {
			if ( position < stack.length - 1 ) {
				position++;
			}
			return stack[ position ] ?? null;
		},

		get canUndo() {
			return position > 0;
		},

		get canRedo() {
			return position < stack.length - 1;
		},

		get current() {
			return stack[ position ] ?? null;
		},
	};
}
