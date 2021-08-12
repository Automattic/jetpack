/**
 * External dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch, dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

const postDateNoticeContext = 'jetpack-post-date';
const noticesStack = [];

export default function Communicate() {
	const { notices } = useSelect( select => {
		return {
			notices: select( noticesStore ).getNotices( postDateNoticeContext ),
		};
	}, [] );

	const { removeNotice } = useDispatch( noticesStore );

	const snackbarNotices = notices.filter( item => item.type === 'snackbar' );
	if ( ! snackbarNotices?.length ) {
		return null;
	}

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className="post-edit-notices__snackbar"
			onRemove={ id => removeNotice( id, postDateNoticeContext ) }
		/>
	);
}

export function clean() {
	const { removeNotice } = dispatch( noticesStore );

	// Remove current notices.
	const notices = select( noticesStore ).getNotices( postDateNoticeContext );
	if ( ! notices?.length ) {
		return;
	}

	for ( let i = 0; i < notices.length; i++ ) {
		removeNotice( notices[ i ].id, postDateNoticeContext );
	}
}

export function sendSuccess( message, options = {} ) {
	const { createSuccessNotice } = dispatch( noticesStore );

	// Clean notices.
	clean();

	createSuccessNotice( message, {
		...options,
		type: 'snackbar',
		context: postDateNoticeContext,
	} );
}
