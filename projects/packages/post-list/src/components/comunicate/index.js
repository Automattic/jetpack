/**
 * External dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

// Communicate placehodler

export default function Communicate() {
	const { notices } = useSelect( select => {
		return {
			notices: select( noticesStore ).getNotices(),
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
			onRemove={ removeNotice }
		/>
	);
}
