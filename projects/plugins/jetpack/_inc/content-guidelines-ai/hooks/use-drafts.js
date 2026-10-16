import { useCallback, useSyncExternalStore } from '@wordpress/element';
import {
	areAllSectionDraftsEmpty,
	getBlockModalTextarea,
	readSectionDraft,
	subscribeToDrafts,
} from '../lib/drafts';

// Reactive views over the DOM drafts (see lib/drafts.js). Snapshots are
// booleans on purpose: the consumers only pick Generate-vs-Improve labels,
// so components re-render at the empty/non-empty boundary instead of on
// every keystroke. Handlers that need the text read it at click time.

/**
 * Whether a section currently has draft text.
 *
 * @param {string} slug - Section slug.
 * @return {boolean} True when the section's draft is non-empty.
 */
export function useSectionHasDraft( slug ) {
	return useSyncExternalStore(
		subscribeToDrafts,
		useCallback( () => !! readSectionDraft( slug ), [ slug ] )
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
 * Whether the block guideline modal's textarea currently has text.
 *
 * @param {HTMLElement|null} blockModal - The block guideline modal element.
 * @return {boolean} True when the modal draft is non-empty.
 */
export function useBlockHasDraft( blockModal ) {
	return useSyncExternalStore(
		subscribeToDrafts,
		useCallback( () => !! getBlockModalTextarea( blockModal )?.value, [ blockModal ] )
	);
}
