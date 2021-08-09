/**
 * External dependencies
 */
import { Fragment } from '@wordpress/element';
import usePost from '../../hooks/use-post';

export default function PostStatusLabel( { id, postIds, status, type, statuses, fallbackText } ) {
	const post = usePost( { id, postIds, type, status } );
	if ( ! post?.status ) {
		return fallbackText;
	}

	return <Fragment>{ statuses?.[ post.status ] }</Fragment>;
}
