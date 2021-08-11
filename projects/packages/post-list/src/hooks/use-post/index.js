/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * React hook to request site post
 * based on the post ID.
 *
 * @param {number} id - The post ID.
 * @returns {object} The post object. Otherwise, null.
 */
export default function usePost( { id, postIds, status = 'any', type = 'post' } ) {
	const posts = useSelect(
		select => {
			return select( coreStore ).getEntityRecords( 'postType', type, {
				include: postIds,
				status,
			} );
		},
		[ postIds ]
	);

	if ( ! posts?.length ) {
		return;
	}

	const filteredPostById = posts.filter( item => item?.id === id );
	if ( ! filteredPostById?.length ) {
		return;
	}

	return filteredPostById[ 0 ];
}
