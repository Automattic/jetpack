/**
 * External dependencies
 */
import { Fragment } from '@wordpress/element';
import usePost from '../../hooks/use-post';

export default function PostStatusLabel( { id, postIds, type, statuses, fallbackText } ) {
	const post = usePost( { id, postIds, type } );
	if ( ! post?.status ) {
		return fallbackText;
	}

	return <Fragment>{ statuses?.[ post.status ] }</Fragment>;
}
