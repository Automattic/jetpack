/**
 * Floating snackbar layer for the Protect Scan v2 surface. Mirrors the
 * upstream `packages/scan/src/js/notices-list.tsx`: subscribes to the core
 * `notices` store and renders the trailing 3 snackbars via
 * `<SnackbarList>`. Anywhere on the page can fire a snackbar via
 * `useDispatch( noticesStore ).createSuccessNotice(…)` and it surfaces here.
 */
import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

const MAX_VISIBLE = 3;

/**
 * Subscribes to the core notices store and renders the trailing 3 snackbar
 * notices.
 *
 * @return The snackbar list, or `null` when there are no snackbar notices.
 */
export default function NoticesList() {
	const notices = useSelect(
		select =>
			select( noticesStore )
				.getNotices()
				.filter( n => n.type === 'snackbar' ),
		[]
	);
	const { removeNotice } = useDispatch( noticesStore );

	if ( notices.length === 0 ) {
		return null;
	}

	return <SnackbarList notices={ notices.slice( -MAX_VISIBLE ) } onRemove={ removeNotice } />;
}
