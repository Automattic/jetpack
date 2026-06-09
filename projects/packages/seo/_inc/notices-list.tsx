import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { FC } from 'react';

const MAX_VISIBLE_NOTICES = 3;

/**
 * Floating snackbar layer for the SEO admin page. Subscribes to the core
 * `notices` store and renders the trailing snackbars. Anywhere in the page can
 * fire one via `useDispatch( noticesStore ).createSuccessNotice( …, { type: 'snackbar' } )`.
 *
 * @return The snackbar list.
 */
const NoticesList: FC = () => {
	const notices = useSelect( select => select( noticesStore ).getNotices(), [] );
	const { removeNotice } = useDispatch( noticesStore );

	const snackbarNotices = notices
		.filter( ( { type } ) => type === 'snackbar' )
		.slice( -MAX_VISIBLE_NOTICES );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className="jetpack-seo__notices"
			onRemove={ removeNotice }
		/>
	);
};

export default NoticesList;
