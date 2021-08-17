/**
 * External dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch, dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

// Notification context ID.
const postDateNoticeContext = 'jetpack-post-list';

export default function Notice() {
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

/**
 * Clean up the notices.
 */
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

/**
 * Send success message to the UX.
 *
 * @param {string} message - The message to be displayed.
 * @param {object} [options] - Options for the notice.
 * @returns {void}
 */
export function sendSuccess( message, options = {} ) {
	const { createSuccessNotice } = dispatch( noticesStore );

	clean();

	createSuccessNotice( message, {
		...options,
		type: 'snackbar',
		context: postDateNoticeContext,
	} );
}
