import { useCallback, useSyncExternalStore } from '@wordpress/element';
import {
	areAllSectionDraftsEmpty,
	getBlockModalTextarea,
	readSectionDraft,
	subscribeToDrafts,
} from '../lib/drafts';

// Reactive views over the DOM drafts (see lib/drafts.js). Snapshots are
// primitives, so useSyncExternalStore re-renders only on actual changes.

/**
 * The live draft text of a section.
 *
 * @param {string} slug - Section slug.
 * @return {string} The draft text.
 */
export function useSectionDraft( slug ) {
	return useSyncExternalStore(
		subscribeToDrafts,
		useCallback( () => readSectionDraft( slug ), [ slug ] )
	);
}

/**
 * Whether every section's draft is empty.
 *
 * @return {boolean} True when no section has text.
 */
export function useAllSectionsEmpty() {
	return useSyncExternalStore( subscribeToDrafts, areAllSectionDraftsEmpty );
}

/**
 * The live draft text of the block guideline modal's textarea.
 *
 * @param {HTMLElement|null} blockModal - The block guideline modal element.
 * @return {string} The draft text.
 */
export function useBlockDraft( blockModal ) {
	return useSyncExternalStore(
		subscribeToDrafts,
		useCallback( () => getBlockModalTextarea( blockModal )?.value || '', [ blockModal ] )
	);
}
