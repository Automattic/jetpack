/**
 * Hook to load synced form content into the editor (one-time sync on mount/ref change)
 */

import { useEffect, useRef } from '@wordpress/element';
import { filterSyncedAttributes } from '../util/form-sync.ts';
import type { Block } from '@wordpress/blocks';

interface UseSyncedFormLoaderParams {
	ref?: number;
	syncedFormBlocks: Block[] | null;
	syncedFormAttributes: Record< string, unknown > | null;
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	replaceInnerBlocks: ( clientId: string, blocks: Block[], updateSelection: boolean ) => void;
	__unstableMarkNextChangeAsNotPersistent: () => void;
	setActiveStep: ( formClientId: string, stepClientId: string ) => void;
}

interface UseSyncedFormLoaderResult {
	isSyncingRef: React.MutableRefObject< boolean >;
}

/**
 * Helper to find the first step block in a multistep form structure.
 *
 * @param {Block[]} blocks - The blocks to search through.
 * @return {string|null} The clientId of the first step block, or null if not found.
 */
function findFirstStepClientId( blocks: Block[] ): string | null {
	for ( const block of blocks ) {
		if ( block.name === 'jetpack/form-step-container' && block.innerBlocks?.length ) {
			const firstStep = block.innerBlocks.find( b => b.name === 'jetpack/form-step' );
			return firstStep?.clientId || null;
		}
		if ( block.innerBlocks?.length ) {
			const found = findFirstStepClientId( block.innerBlocks );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
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
	setActiveStep,
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

		// For multistep forms, select the first step so the editor shows it immediately
		const firstStepClientId = findFirstStepClientId( syncedFormBlocks );
		if ( firstStepClientId ) {
			setActiveStep( clientId, firstStepClientId );
		}

		// Reset syncing flag after a short delay
		const timeoutId = setTimeout( () => {
			isSyncingRef.current = false;
		}, 100 );

		return () => {
			clearTimeout( timeoutId );
		};
	}, [
		ref,
		syncedFormBlocks,
		syncedFormAttributes,
		clientId,
		__unstableMarkNextChangeAsNotPersistent,
		replaceInnerBlocks,
		setAttributes,
		setActiveStep,
	] );

	return { isSyncingRef };
}
