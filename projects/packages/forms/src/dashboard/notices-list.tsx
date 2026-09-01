/**
 * External dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

// Last three notices. Slices from the tail end of the list.
const MAX_VISIBLE_NOTICES = 3;

/**
 * This component renders the notices displayed in the dashboard.
 * It displays pinned notices first, followed by dismissible ones.
 *
 * @return {JSX.Element} The rendered EditorNotices component.
 */
export default function DashboardNotices(): JSX.Element {
	const notices = useSelect( select => select( noticesStore ).getNotices(), [] );
	const { removeNotice } = useDispatch( noticesStore );

	const snackbarNotices = notices
		.filter( ( { type } ) => type === 'snackbar' )
		.slice( -MAX_VISIBLE_NOTICES );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className="forms-dashboard-notices"
			onRemove={ removeNotice }
		/>
	);
}
