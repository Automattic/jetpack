import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import styles from './styles.module.scss';

// Last three notices. Slices from the tail end of the list.
const MAX_VISIBLE_NOTICES = 3;

/**
 * Renders the snackbars component.
 *
 * @returns {import('react').ReactNode} The rendered component.
 */
export function GlobalNotices() {
	const notices = useSelect( select => select( noticesStore ).getNotices(), [] );
	const { removeNotice } = useDispatch( noticesStore );
	const snackbarNotices = notices
		.filter( ( { type } ) => type === 'snackbar' )
		.slice( -MAX_VISIBLE_NOTICES );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className={ styles[ 'global-notices' ] }
			onRemove={ removeNotice }
		/>
	);
}
