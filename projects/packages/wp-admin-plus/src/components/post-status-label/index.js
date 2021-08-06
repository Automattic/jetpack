/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Fragment } from '@wordpress/element';

export default function PostStatusLabel( { id, postIds, status, type, statuses, fallbackText } ) {
	const post = useSelect(
		select => {
			const posts = select( coreStore ).getEntityRecords( 'postType', type, {
				include: postIds,
				status,
			} );

			if ( ! posts?.length ) {
				return;
			}

			const filteredPostById = posts.filter( item => item?.id === id );
			if ( ! filteredPostById?.length ) {
				return;
			}

			return filteredPostById[ 0 ];
		},
		[ postIds, id ]
	);

	if ( ! post?.status ) {
		return fallbackText;
	}
	return <Fragment>{ statuses?.[ post.status ] }</Fragment>;
}
