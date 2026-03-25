/**
 * Block collection utility functions
 *
 * Manages the Jetpack block collection visibility in the form editor.
 * The collection is removed when entering the form editor to declutter
 * the block inserter, and restored when leaving.
 *
 * @package
 */

import { select, dispatch } from '@wordpress/data';

interface BlockCollectionData {
	title: string;
	icon?: unknown;
}

const JETPACK_COLLECTION_NAMESPACE = 'jetpack';

let savedCollection: BlockCollectionData | null = null;

/**
 * Remove the Jetpack block collection from the block inserter.
 *
 * Saves the collection data so it can be restored later.
 * No-op if the collection doesn't exist or the store API is unavailable.
 */
export const removeJetpackBlockCollection = () => {
	const blocksStore = select( 'core/blocks' ) as {
		getCollections?: () => Record< string, BlockCollectionData >;
	};

	if ( typeof blocksStore.getCollections !== 'function' ) {
		return;
	}

	const collections = blocksStore.getCollections();
	const jetpackCollection = collections[ JETPACK_COLLECTION_NAMESPACE ];

	if ( ! jetpackCollection ) {
		return;
	}

	const blocksDispatch = dispatch( 'core/blocks' ) as {
		removeBlockCollection?: ( namespace: string ) => void;
	};

	if ( typeof blocksDispatch.removeBlockCollection !== 'function' ) {
		return;
	}

	savedCollection = jetpackCollection;
	blocksDispatch.removeBlockCollection( JETPACK_COLLECTION_NAMESPACE );
};

/**
 * Restore the Jetpack block collection to the block inserter.
 *
 * Re-registers the collection using the data saved during removal.
 * No-op if no collection was previously saved or the store API is unavailable.
 */
export const restoreJetpackBlockCollection = () => {
	if ( ! savedCollection ) {
		return;
	}

	const blocksDispatch = dispatch( 'core/blocks' ) as {
		addBlockCollection?: ( namespace: string, title: string, icon?: unknown ) => void;
	};

	if ( typeof blocksDispatch.addBlockCollection !== 'function' ) {
		return;
	}

	try {
		blocksDispatch.addBlockCollection(
			JETPACK_COLLECTION_NAMESPACE,
			savedCollection.title,
			savedCollection.icon
		);
		savedCollection = null;
	} catch {
		// If re-registration fails, keep savedCollection so it can be retried later.
	}
};
