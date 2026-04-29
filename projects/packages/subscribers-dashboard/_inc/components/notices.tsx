import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

type SnackbarNotice = {
	id: string;
	content: string;
	[ key: string ]: unknown;
};

/**
 * Snackbar notices container — surfaces success / error messages dispatched via
 * `@wordpress/notices` (e.g. by the remove-subscriber mutation).
 *
 * @return Snackbar list anchored to the bottom of the page.
 */
export default function Notices(): JSX.Element {
	const notices = useSelect(
		select =>
			(
				select( noticesStore ) as {
					getNotices: () => SnackbarNotice[];
				}
			 )
				.getNotices()
				.filter( notice => notice.type === 'snackbar' ),
		[]
	);

	const { removeNotice } = useDispatch( noticesStore );

	return (
		<SnackbarList
			notices={ notices }
			className="jetpack-subscribers-dashboard__notices"
			onRemove={ removeNotice }
		/>
	);
}
