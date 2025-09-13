import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Custom hook to find a block recursively within the inner blocks of a given root block ID.
 *
 * @param {string}   searchRootClientId - The client ID of the block whose descendants will be searched.
 * @param {Function} predicateFn        - A function that takes a block and returns true if it's the desired block.
 * @return  {Object|null} The first block found that satisfies the predicate, or null if not found or if searchRootClientId is invalid.
 */
export const useFindBlockRecursively = ( searchRootClientId, predicateFn ) => {
	const blocksToSearch = useSelect(
		select => {
			if ( ! searchRootClientId ) {
				return [];
			}
			const { getBlocks } = select( blockEditorStore );
			return getBlocks( searchRootClientId );
		},
		[ searchRootClientId ]
	);

	// Memoize the recursive search result to prevent re-computation on every render unless dependencies change
	const foundBlock = useSelect( () => {
		// performSearch is defined within this useSelect callback.
		// It will use the latest blocksToSearch when this useSelect re-runs.
		const performSearch = ( currentBlocks, predicate ) => {
			if ( ! currentBlocks || currentBlocks.length === 0 ) {
				return null;
			}
			for ( const block of currentBlocks ) {
				if ( predicate( block ) ) {
					return block;
				}
				if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
					const foundInInner = performSearch( block.innerBlocks, predicate );
					if ( foundInInner ) {
						return foundInInner;
					}
				}
			}
			return null;
		};
		return performSearch( blocksToSearch, predicateFn );
	}, [ blocksToSearch, predicateFn ] );

	return foundBlock;
};
