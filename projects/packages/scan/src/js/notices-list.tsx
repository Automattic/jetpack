import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { FC } from 'react';

const MAX_VISIBLE_NOTICES = 3;

/**
 * Floating snackbar layer for the Scan overview. Mirrors Forms'
 * `DashboardNotices`: subscribes to the core `notices` store and renders
 * the trailing 3 snackbars via `<SnackbarList>`. Anywhere in the page
 * can fire a snackbar via `useDispatch( noticesStore ).createSuccessNotice(…)`
 * and it'll surface here.
 *
 * @return The snackbar list, or `null` when there are no snackbars.
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
			className="jetpack-scan-page__notices"
			onRemove={ removeNotice }
		/>
	);
};

export default NoticesList;
