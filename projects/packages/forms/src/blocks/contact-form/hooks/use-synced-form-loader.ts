/**
 * Hook to load synced form content into the editor (one-time sync on mount/ref change)
 */

import { useEffect, useRef } from '@wordpress/element';
import { filterSyncedAttributes } from '../utils/synced-form-helpers.ts';

interface UseSyncedFormLoaderParams {
	ref?: number;
	syncedFormBlocks: unknown[] | null;
	syncedFormAttributes: Record< string, unknown > | null;
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	replaceInnerBlocks: ( clientId: string, blocks: unknown[], updateSelection: boolean ) => void;
	__unstableMarkNextChangeAsNotPersistent: () => void;
}

interface UseSyncedFormLoaderResult {
	isSyncingRef: React.MutableRefObject< boolean >;
}

/**
 * Hook to handle loading synced form content into the editor
 * This performs a one-time sync when the ref changes or loads for the first time
 * After loading, the user can edit freely and changes will be saved back via auto-save
 *
 * @param {UseSyncedFormLoaderParams} params - Configuration parameters
 * @return {UseSyncedFormLoaderResult} Object containing syncing state ref
 */
export function useSyncedFormLoader( {
	ref,
	syncedFormBlocks,
	syncedFormAttributes,
	clientId,
	setAttributes,
	replaceInnerBlocks,
	__unstableMarkNextChangeAsNotPersistent,
}: UseSyncedFormLoaderParams ): UseSyncedFormLoaderResult {
	// Track if we're currently syncing to prevent save-back loops
	const isSyncingRef = useRef( false );
	const lastLoadedRefId = useRef< number | null >( null );

	useEffect( () => {
		if ( ! ref || ! syncedFormBlocks ) {
			return;
		}

		// Only sync when ref changes or loads for the first time
		// Don't re-sync when syncedFormBlocks changes due to our own edits
		if ( lastLoadedRefId.current === ref ) {
			return; // Already loaded this ref
		}

		// Mark this ref as loaded
		lastLoadedRefId.current = ref;

		// Sync on initial load
		// Once loaded, the user can edit freely and changes will save back to the source
		isSyncingRef.current = true;

		// Apply form attributes from the synced form (except ref and layout attrs)
		// Mark as non-persistent so they're not saved locally - only ref is saved
		if ( syncedFormAttributes ) {
			const attrsToApply = filterSyncedAttributes( syncedFormAttributes );

			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( attrsToApply );
		}

		// Load inner blocks from source
		__unstableMarkNextChangeAsNotPersistent();
		replaceInnerBlocks( clientId, syncedFormBlocks, false );

		// Reset syncing flag after a short delay
		setTimeout( () => {
			isSyncingRef.current = false;
		}, 100 );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ ref, syncedFormBlocks, syncedFormAttributes, clientId ] );

	return { isSyncingRef };
}
