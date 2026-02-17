/**
 * Hook to auto-save editor changes back to synced form post
 */

import { useEffect } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { serializeSyncedForm } from '../util/form-sync.ts';

interface UseSyncedFormAutoSaveParams {
	ref?: number;
	syncedForm: { content?: { raw?: string } } | null;
	attributes: Record< string, unknown >;
	currentInnerBlocks: unknown[];
	isSyncingRef: React.MutableRefObject< boolean >;
	editEntityRecord: (
		kind: string,
		name: string,
		recordId: number,
		edits: Record< string, unknown >
	) => void;
}

/**
 * Hook to automatically save changes from the editor back to the synced form post
 * Uses a debounce strategy to avoid excessive saves (1 second delay)
 * Only saves if content has changed and we're not currently loading
 *
 * @param {UseSyncedFormAutoSaveParams} params - Configuration parameters
 */
export function useSyncedFormAutoSave( {
	ref,
	syncedForm,
	attributes,
	currentInnerBlocks,
	isSyncingRef,
	editEntityRecord,
}: UseSyncedFormAutoSaveParams ): void {
	useEffect( () => {
		if ( ! ref || ! syncedForm || isSyncingRef.current ) {
			return; // Not a synced form or currently syncing
		}

		// Serialize the entire form block
		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );

		// Only update if content has changed
		if ( serialized !== syncedForm.content?.raw ) {
			// Debounce to avoid excessive saves
			const timeoutId = setTimeout( () => {
				editEntityRecord( 'postType', FORM_POST_TYPE, ref, {
					content: serialized,
				} );
			}, 1000 ); // 1 second debounce

			return () => clearTimeout( timeoutId );
		}
	}, [ currentInnerBlocks, ref, syncedForm, editEntityRecord, attributes, isSyncingRef ] );
}
